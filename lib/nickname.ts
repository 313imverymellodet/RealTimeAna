// A friendly, stable label for an anonymous visitor hash, e.g. "Amber Falcon".
// Purely cosmetic: it is derived from the hash and carries no extra information.

const ADJECTIVES = [
  "Amber", "Brisk", "Calm", "Clever", "Coral", "Daring", "Eager", "Gentle", "Golden", "Hidden", "Indigo", "Jolly",
  "Keen", "Lively", "Lucky", "Mellow", "Nimble", "Quiet", "Rapid", "Silver", "Sunny", "Swift", "Violet", "Witty",
]

const ANIMALS = [
  "Badger", "Bison", "Crane", "Dolphin", "Falcon", "Finch", "Fox", "Gecko", "Heron", "Ibex", "Koala", "Lemur",
  "Lynx", "Marten", "Otter", "Owl", "Panda", "Puffin", "Raven", "Seal", "Stoat", "Tapir", "Wolf", "Wren",
]

const COLORS = ["#4ade80", "#38bdf8", "#f59e0b", "#f472b6", "#a78bfa", "#fb7185", "#2dd4bf", "#facc15"]

function part(hash: string, offset: number) {
  return Number.parseInt(hash.slice(offset, offset + 4), 16) || 0
}

export function visitorNickname(hash: string) {
  return `${ADJECTIVES[part(hash, 0) % ADJECTIVES.length]} ${ANIMALS[part(hash, 4) % ANIMALS.length]}`
}

export function visitorColor(hash: string) {
  return COLORS[part(hash, 8) % COLORS.length]
}
