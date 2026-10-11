import { Shield, Cookie, Zap } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "GDPR compliant",
    description: "We pseudonymize data by default, ensuring total privacy and compliance with GDPR.",
  },
  {
    icon: Cookie,
    title: "No cookie banners",
    description: "Our default settings are cookie-free, so you never need annoying consent banners for users.",
  },
  {
    icon: Zap,
    title: "Actually realtime",
    description: "Watch visitors and events stream to your dashboard the millisecond they happen.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
