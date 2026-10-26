import { Link } from "react-router-dom";
import { CreditCard, Headphones, MapPin, PackageSearch, Phone, ShieldCheck } from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import Button from "../components/ui/Button";

const hotlines = [
  {
    number: "+234 816 726 3662",
    tel: "+2348167263662",
    label: "Order and payment support",
  },
  {
    number: "+234 803 352 2914",
    tel: "+2348033522914",
    label: "Delivery and account support",
  },
  {
    number: "+234 806 353 2990",
    tel: "+2348063532990",
    label: "General shopping support",
  },
];

const helpTopics = [
  {
    icon: CreditCard,
    title: "Payment checks",
    text: "Have your order reference and Paystack payment reference ready. Never send card details to anyone.",
  },
  {
    icon: PackageSearch,
    title: "Order or delivery issue",
    text: "Share the order reference so the team can look up the latest server status and fulfillment update.",
  },
  {
    icon: ShieldCheck,
    title: "Payment received, order on hold",
    text: "If checkout says a payment needs review, do not pay again. Contact customer care for a manual check.",
  },
];

export default function ContactPage() {
  useDocumentTitle("Contact Us");

  return (
    <main>
      <section className="border-b border-line bg-deep py-14 text-white">
        <div className="page-container grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
              Customer care
            </span>
            <h1 className="mt-4 max-w-2xl text-[clamp(2.4rem,5vw,4.2rem)] font-extrabold leading-[0.98] tracking-[-0.07em]">
              Contact us. We are here to help.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65">
              Need help with an order, payment confirmation, or delivery? Reach the KubeCart
              customer-care team on any support line below.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-accent text-white">
                <Headphones size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                  Support line
                </p>
                <p className="mt-1 font-extrabold">Ready to assist</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Order questions, payment checks, and delivery updates. Tap any number to call from
              your phone.
            </p>
            <Button as={Link} to="/order" className="mt-5 w-full" size="lg">
              Track an order instead
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="max-w-2xl">
            <span className="eyebrow">Talk to KubeCart</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.05em]">
              Customer care hotlines
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Our team can help with order questions and payment verification. Have your order
              reference close before you call.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {hotlines.map((hotline, index) => (
              <a
                key={hotline.tel}
                href={`tel:${hotline.tel}`}
                className="group rounded-3xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">
                    0{index + 1}
                  </span>
                  <Phone size={18} className="text-accent" aria-hidden="true" />
                </div>
                <p className="mt-6 text-sm font-semibold text-muted">Customer care</p>
                <p className="mt-1 text-xl font-extrabold tracking-tight group-hover:text-accent">
                  {hotline.number}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{hotline.label}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="page-container grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
            <span className="eyebrow-dark">Before you call</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
              Keep your order details close
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Order references look like <strong>KBC-A1B2C3D4E5F6</strong>. Having the order
              reference and payment reference ready helps the team verify and resolve your request
              faster.
            </p>
            <div className="mt-5 grid gap-3">
              {helpTopics.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3 rounded-2xl bg-page p-4">
                  <Icon size={19} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-accent p-6 text-white shadow-soft sm:p-8">
            <MapPin size={24} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Delivery coverage</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              KubeCart checkout currently supports Nigerian delivery details. Delivery fees are
              confirmed by the server when your order is created, and the final total is shown
              before you pay.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button as={Link} to="/order" variant="dark">
                Track your order
              </Button>
              <Button as={Link} to="/products" variant="secondary">
                Continue shopping
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
