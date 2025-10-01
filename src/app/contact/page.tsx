// src/app/contact/page.tsx
import { Mail, Phone, MapPin } from 'lucide-react'
import { ContactForm } from './contact-form'

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Header section stays the same */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Contact Us
            </h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Get in touch with our team. We would love to hear from you.
            </p>
          </div>
        </div>
      </div>

      {/* Replace static form with ContactForm component */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
            <ContactForm />
          </div>
          
          {/* Keep your existing contact info section */}
          <div>
            {/* ... rest of your contact info ... */}
          </div>
        </div>
      </div>
    </div>
  )
}
