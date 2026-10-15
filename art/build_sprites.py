"""Renders the Housecount sprite frames with Blender.

Two characters, built from simple shapes so they stay readable at ~40 px:

  reader  A bean-shaped theatre-goer holding an amber ticket. Their body takes
          the colour of the channel they arrived from. Walk cycles in four
          directions (up = toward the stage, down = toward the exit).
  usher   The house usher in house-lights amber, with a pillbox cap and a
          flashlight. An idle loop and a flashlight wave for new arrivals.

Run headless (writes PNG frames to the folder given after "--"):

    /Applications/Blender.app/Contents/MacOS/Blender -b --python art/build_sprites.py -- /tmp/frames

then `python3 art/compose_sprites.py /tmp/frames` packs them into sheets.
"""

import math
import os
import sys

import bpy

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/housecount-frames"
SIZE = 96  # pixels per frame; shown at about half that, so it stays sharp on retina screens
FRAMES = 8

CHANNELS = {
    "search": "#0071e3",
    "social": "#d6336c",
    "newsletter": "#7c3aed",
    "paid": "#0d9488",
    "referral": "#64748b",
    "direct": "#2c2c30",
}
AMBER = "#f5a623"
INK = "#1d1d1f"
SHOE = "#2b2b2e"
FACE = "#fff8ec"
CAP = "#24242a"
LENS = "#fff3c4"

# Character turned so it walks toward these screen directions (camera looks "up" the screen)
DIRECTIONS = {"up": 0.0, "right": -90.0, "down": 180.0, "left": 90.0}


def linear(hex_color):
    """sRGB hex to the linear RGBA Blender expects."""
    channels = [int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return (*lin, 1.0)


def shade(hex_color, factor):
    """Darken (factor < 1) or lighten (factor > 1) a hex colour."""
    r, g, b = (int(hex_color[i : i + 2], 16) for i in (1, 3, 5))
    clamp = lambda v: max(0, min(255, round(v)))
    if factor < 1:
        r, g, b = (clamp(c * factor) for c in (r, g, b))
    else:
        r, g, b = (clamp(c + (255 - c) * (factor - 1)) for c in (r, g, b))
    return f"#{r:02x}{g:02x}{b:02x}"


def material(name, hex_color, outline=True):
    """Cel shading: the light is snapped into a shadow band, the base colour and a
    small highlight, then emitted flat. Works only in EEVEE (Shader to RGB)."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    diffuse = nodes.new("ShaderNodeBsdfDiffuse")
    to_rgb = nodes.new("ShaderNodeShaderToRGB")
    ramp = nodes.new("ShaderNodeValToRGB")
    emission = nodes.new("ShaderNodeEmission")
    output = nodes.new("ShaderNodeOutputMaterial")

    stops = ramp.color_ramp
    stops.interpolation = "CONSTANT"
    stops.elements[0].position = 0.0
    stops.elements[0].color = linear(shade(hex_color, 0.74))
    stops.elements[1].position = 0.2
    stops.elements[1].color = linear(hex_color)
    highlight = stops.elements.new(0.62)
    highlight.color = linear(shade(hex_color, 1.22))

    links.new(diffuse.outputs[0], to_rgb.inputs[0])
    links.new(to_rgb.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], emission.inputs["Color"])
    links.new(emission.outputs[0], output.inputs["Surface"])
    mat["outline"] = outline
    return mat


def outline_material():
    """Inverted-hull outline: a dark shell that only shows its back faces."""
    mat = bpy.data.materials.get("Outline")
    if mat:
        return mat
    mat = bpy.data.materials.new("Outline")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = linear("#16161a")
    output = nodes.new("ShaderNodeOutputMaterial")
    mat.node_tree.links.new(emission.outputs[0], output.inputs["Surface"])
    mat.use_backface_culling = True
    return mat


def finish(obj, mat, parent):
    """Bakes the shape's size into the mesh so the outline is the same width everywhere."""
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if mat.get("outline", True):
        obj.data.materials.append(outline_material())
        shell = obj.modifiers.new("Outline", "SOLIDIFY")
        shell.thickness = 0.028
        shell.offset = 1.0
        shell.use_flip_normals = True
        shell.material_offset = 1
        shell.use_rim = False
    obj.parent = parent
    return obj


def reset_scene(ortho_scale=1.6, look_height=0.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = SIZE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filter_size = 0.9
    scene.view_settings.view_transform = "Standard"
    scene.eevee.taa_render_samples = 32

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
    scene.world = world

    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = 3.2
    # No cast shadows: they only add speckle at this size, and the cel bands do the shaping
    sun_data.use_shadow = False
    sun_data.angle = 0.0
    sun = bpy.data.objects.new("Sun", sun_data)
    scene.collection.objects.link(sun)
    # Light from the upper left, slightly in front, like a stage light
    sun.rotation_euler = (math.radians(42), math.radians(-28), math.radians(-30))

    camera_data = bpy.data.cameras.new("Camera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = ortho_scale
    camera = bpy.data.objects.new("Camera", camera_data)
    scene.collection.objects.link(camera)
    # Looking down at about 40 degrees from behind the audience, like the seat map
    camera.location = (0.0, -6.0, 5.75 + look_height)
    camera.rotation_euler = (math.radians(47), 0.0, 0.0)
    scene.camera = camera
    return scene


def blob(name, size, location, mat, parent, segments=32):
    """An ellipsoid: the only shape these characters need."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=segments // 2, radius=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    obj.location = location
    bpy.ops.object.shade_smooth()
    return finish(obj, mat, parent)


def box(name, size, location, mat, parent, bevel=0.015):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    obj.location = location
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new("Bevel", "BEVEL")
    modifier.width = bevel
    modifier.segments = 3
    return finish(obj, mat, parent)


def cylinder(name, radius, depth, location, rotation, mat, parent):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.location = location
    obj.rotation_euler = rotation
    bpy.ops.object.shade_smooth()
    return finish(obj, mat, parent)


def pivot(name, location, parent):
    empty = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(empty)
    empty.location = location
    empty.parent = parent
    return empty


def build_character(body_hex, usher=False):
    """Returns the rig: a dict of the parts the animation moves. Faces +Y."""
    root = pivot("Root", (0, 0, 0), None)
    body_pivot = pivot("BodyPivot", (0, 0, 0.12), root)

    body_mat = material("Body", body_hex)
    limb_mat = material("Limb", shade(body_hex, 0.82))
    face_mat = material("Face", FACE)
    eye_mat = material("Eye", INK, outline=False)
    shoe_mat = material("Shoe", SHOE)

    blob("Body", (0.34, 0.30, 0.44), (0, 0, 0.44), body_mat, body_pivot)
    # Face visor on the front, with two eyes
    blob("Face", (0.2, 0.07, 0.13), (0, 0.235, 0.6), face_mat, body_pivot)
    eyes = [
        blob("EyeL", (0.032, 0.03, 0.048), (-0.07, 0.297, 0.615), eye_mat, body_pivot, 16),
        blob("EyeR", (0.032, 0.03, 0.048), (0.07, 0.297, 0.615), eye_mat, body_pivot, 16),
    ]

    arm_l = pivot("ArmL", (-0.32, 0.0, 0.52), body_pivot)
    arm_r = pivot("ArmR", (0.32, 0.0, 0.52), body_pivot)
    blob("HandL", (0.075, 0.075, 0.15), (0, 0, -0.1), limb_mat, arm_l, 20)
    blob("HandR", (0.075, 0.075, 0.15), (0, 0, -0.1), limb_mat, arm_r, 20)

    foot_l = pivot("FootL", (-0.12, 0.02, 0.06), root)
    foot_r = pivot("FootR", (0.12, 0.02, 0.06), root)
    blob("ShoeL", (0.095, 0.14, 0.06), (0, 0.03, 0), shoe_mat, foot_l, 20)
    blob("ShoeR", (0.095, 0.14, 0.06), (0, 0.03, 0), shoe_mat, foot_r, 20)

    if usher:
        cap_mat = material("Cap", CAP)
        band_mat = material("Band", AMBER)
        cylinder("Cap", 0.17, 0.11, (0, 0.0, 0.93), (math.radians(-8), 0, 0), cap_mat, body_pivot)
        cylinder("CapBand", 0.172, 0.035, (0, 0.0, 0.905), (math.radians(-8), 0, 0), band_mat, body_pivot)
        box("BowTie", (0.16, 0.05, 0.06), (0, 0.29, 0.43), cap_mat, body_pivot, 0.02)
        torch_mat = material("Torch", INK)
        lens_mat = material("Lens", LENS)
        cylinder("Torch", 0.045, 0.24, (0.0, 0.08, -0.2), (math.radians(90), 0, 0), torch_mat, arm_r)
        cylinder("TorchLens", 0.055, 0.03, (0.0, 0.21, -0.2), (math.radians(90), 0, 0), lens_mat, arm_r)
    else:
        ticket_mat = material("Ticket", AMBER)
        box("Ticket", (0.15, 0.02, 0.09), (0.02, 0.08, -0.2), ticket_mat, arm_r, 0.01)

    return {"root": root, "body": body_pivot, "arm_l": arm_l, "arm_r": arm_r, "foot_l": foot_l, "foot_r": foot_r, "eyes": eyes}


def pose_walk(rig, phase):
    """One moment of the walk cycle; phase runs 0 to 1."""
    swing = math.sin(2 * math.pi * phase)
    lift = max(0.0, math.cos(2 * math.pi * phase))
    lift_other = max(0.0, -math.cos(2 * math.pi * phase))

    rig["foot_l"].location.y = 0.02 + 0.13 * swing
    rig["foot_r"].location.y = 0.02 - 0.13 * swing
    rig["foot_l"].location.z = 0.06 + 0.07 * lift
    rig["foot_r"].location.z = 0.06 + 0.07 * lift_other
    rig["foot_l"].rotation_euler.x = math.radians(18 * swing)
    rig["foot_r"].rotation_euler.x = math.radians(-18 * swing)

    # Two bobs per cycle, a little sway, arms opposite to the feet
    rig["body"].location.z = 0.12 + 0.045 * (1 - math.cos(4 * math.pi * phase)) / 2
    rig["body"].rotation_euler.y = math.radians(5 * swing)
    rig["body"].rotation_euler.x = math.radians(4)
    rig["arm_l"].rotation_euler.x = math.radians(-32 * swing)
    rig["arm_r"].rotation_euler.x = math.radians(32 * swing)


def pose_idle(rig, phase, blink=False):
    breath = (1 - math.cos(2 * math.pi * phase)) / 2
    rig["body"].location.z = 0.12 + 0.025 * breath
    rig["body"].scale = (1.0 + 0.015 * breath, 1.0, 1.0 - 0.015 * breath)
    rig["body"].rotation_euler = (0, math.radians(2.5 * math.sin(2 * math.pi * phase)), 0)
    rig["arm_l"].rotation_euler = (0, math.radians(-6), 0)
    rig["arm_r"].rotation_euler = (math.radians(-25), math.radians(8), 0)
    for eye in rig["eyes"]:
        eye.scale.z = 0.15 if blink else 1.0


def pose_wave(rig, phase):
    """The usher raises the flashlight and sweeps it twice."""
    raise_amount = min(1.0, math.sin(math.pi * phase) * 1.6)
    sweep = math.sin(4 * math.pi * phase)
    rig["body"].location.z = 0.12 + 0.03 * abs(sweep)
    rig["body"].scale = (1, 1, 1)
    rig["body"].rotation_euler = (0, math.radians(4 * sweep), 0)
    rig["arm_l"].rotation_euler = (0, math.radians(-10), 0)
    rig["arm_r"].rotation_euler = (math.radians(-25 - 120 * raise_amount), math.radians(22 * sweep * raise_amount), 0)
    for eye in rig["eyes"]:
        eye.scale.z = 1.0


def render(scene, path):
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    os.makedirs(OUT, exist_ok=True)

    for channel, body_hex in CHANNELS.items():
        scene = reset_scene()
        rig = build_character(body_hex)
        for direction, angle in DIRECTIONS.items():
            rig["root"].rotation_euler.z = math.radians(angle)
            for frame in range(FRAMES):
                pose_walk(rig, frame / FRAMES)
                render(scene, os.path.join(OUT, f"reader-{channel}-{direction}-{frame}.png"))

    # The usher is taller (cap), so the camera frames a little more and sits a little higher
    scene = reset_scene(ortho_scale=1.75, look_height=0.12)
    rig = build_character(AMBER, usher=True)
    rig["root"].rotation_euler.z = math.radians(DIRECTIONS["down"])
    for frame in range(FRAMES):
        pose_idle(rig, frame / FRAMES, blink=frame == 5)
        render(scene, os.path.join(OUT, f"usher-idle-{frame}.png"))
    for frame in range(FRAMES):
        pose_wave(rig, frame / FRAMES)
        render(scene, os.path.join(OUT, f"usher-wave-{frame}.png"))


main()
