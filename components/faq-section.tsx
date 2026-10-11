import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "Is Visitors GDPR compliant?",
    answer:
      "Yes, Visitors is fully GDPR compliant. We pseudonymize data by default and don't use cookies, ensuring total privacy for your users.",
  },
  {
    question: "Do I need a cookie consent banner?",
    answer:
      "No, you don't need a cookie consent banner. Our default settings are cookie-free, so you never need annoying consent banners for your users.",
  },
  {
    question: "What happens if I go over my plans limits?",
    answer:
      "If you exceed your plan limits, we'll notify you and give you the option to upgrade. We won't cut off your analytics mid-month.",
  },
  {
    question: "Do you have a free plan?",
    answer: "We offer a 14-day free trial with full access to all features. No credit card required to get started.",
  },
  {
    question: "How does Visitors compare to Google Analytics?",
    answer:
      "Visitors is privacy-focused, faster, and much simpler to use. Unlike Google Analytics, we don't track personal data and don't require cookie consent banners.",
  },
  {
    question: "How hard is it to get started?",
    answer:
      "Getting started takes less than 5 minutes. Just add our lightweight script to your website and start seeing visitors in realtime.",
  },
]

export function FAQSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
            FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
          <p className="text-muted-foreground">
            Quick answers to common questions about pricing, privacy, setup, and more.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
