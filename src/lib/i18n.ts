"use client";

import { useEffect, useState } from "react";

import type { Gender } from "@prisma/client";

import { DEFAULT_REGION_CODE, regionByCode, useRegionStore } from "@/store/region";

/**
 * Storefront-chrome copy (header, hero, footer, homepage rails) in the
 * three languages the region switcher offers. Deliberately scoped to
 * static UI text only — product names come from the database and are
 * not translated, and prices stay in EUR everywhere (see
 * `src/store/region.ts`). Category names are also database-driven but
 * are localized via `categoryLabel`, since the `megaMenu` copy below
 * already covers every category slug from `prisma/seed.ts`.
 */
const translations = {
  en: {
    nav: {
      home: "Home",
      shop: "Shop",
      collections: "Collections",
      aboutUs: "About Us",
      contact: "Contact",
      menu: "Menu",
      closeMenu: "Close menu",
    },
    regionSwitcher: {
      trigger: "Language and region",
      language: "Language",
      region: "Region",
      selectLanguage: "Select site language",
      selectRegion: "Select region",
      close: "Close",
    },
    notificationBar: "Free shipping on all orders above €150",
    hero: {
      eyebrow: "New Arrivals",
      titleLine1: "Off the grid.",
      titleLine2: "On the radar.",
      description:
        "Balenciaga, Nike, Stone Island and more — authenticated, curated and priced for the people who actually wear it.",
      cta: "Shop Now",
    },
    features: {
      freeShipping: { title: "Free Shipping", text: "On all orders above €150" },
      premiumQuality: { title: "Premium Quality", text: "Authenticated & quality checked" },
      easyReturns: { title: "Easy Returns", text: "Hassle-free 30-day returns" },
      support: { title: "24/7 Support", text: "We're here to help anytime" },
    },
    shopByCategory: {
      heading: "Shop by Category",
      viewAll: "All Categories",
    },
    collectionsMarquee: {
      heading: "Browse Collections",
    },
    trendingNow: {
      heading: "Trending Now",
      viewAll: "View All",
    },
    footer: {
      tagline:
        "Multi-brand fashion for people who dress off the grid. Curated labels, authenticated pieces, shipped worldwide.",
      columns: {
        shop: {
          title: "Shop",
          links: {
            allProducts: "All Products",
            hoodies: "Hoodies",
            tshirts: "T-Shirts",
            pants: "Pants",
            jackets: "Jackets",
            accessories: "Accessories",
          },
        },
        company: {
          title: "Company",
          links: {
            aboutUs: "About Us",
            contactUs: "Contact Us",
            shipping: "Shipping & Delivery",
            returns: "Returns & Refunds",
            privacy: "Privacy Policy",
          },
        },
        help: {
          title: "Help",
          links: {
            faqs: "FAQs",
            trackOrder: "Track Your Order",
            sizeGuide: "Size Guide",
            terms: "Terms & Conditions",
          },
        },
      },
      newsletter: {
        title: "Newsletter",
        blurb: "Get exclusive updates on new drops and special offers.",
        placeholder: "Enter your email",
        subscribe: "Subscribe",
      },
      rights: "All rights reserved.",
    },
    megaMenu: {
      viewAll: "View all",
      genders: { men: "Men", women: "Women", unisex: "Unisex" },
      sections: {
        new: "New",
        clothing: "Clothing",
        shoes: "Shoes",
        accessories: "Accessories",
        brands: "Brands",
        collections: "Collections",
        sale: "Sale",
      },
      clothing: {
        tshirts: "T-Shirts",
        shirts: "Shirts",
        hoodies: "Hoodies & Sweatshirts",
        sweaters: "Sweaters",
        jackets: "Jackets",
        coats: "Coats",
        jeans: "Jeans",
        pants: "Pants",
        shorts: "Shorts",
        dressesSkirts: "Dresses & Skirts",
      },
      shoes: {
        sneakers: "Sneakers",
        canvasShoes: "Canvas Shoes",
        boots: "Boots",
        dressShoes: "Dress Shoes",
        sandals: "Sandals",
      },
      accessories: {
        bags: "Bags",
        backpacks: "Backpacks",
        belts: "Belts",
        wallets: "Wallets",
        sunglasses: "Sunglasses",
        headwear: "Headwear",
        watches: "Watches",
        jewelry: "Jewelry",
      },
    },
    catalog: {
      collections: "Collections",
      allProducts: "All Products",
      newArrivals: "New Arrivals",
      sale: "Sale",
      itemsSuffix: "items",
      noResults: "No products match these filters.",
      filters: {
        title: "Filters",
        clearAll: "Clear all",
        gender: "Gender",
        category: "Category",
        brand: "Brand",
        size: "Size",
        color: "Color",
        price: "Price",
        min: "Min",
        max: "Max",
        apply: "Apply",
        showMore: "Show all",
        showLess: "Show less",
      },
    },
    productCard: {
      featured: "Featured",
      sale: "Sale",
      added: "Added",
      addToCart: "Add to Cart",
      lowStock: (n: number) => `Only ${n} left`,
    },
    productPage: {
      home: "Home",
      tabs: {
        details: "Details",
        materials: "Materials",
        fit: "Size & Fit",
        shipping: "Shipping & Returns",
      },
      materials: [
        "Heavyweight cotton, garment-washed for a broken-in hand",
        "Ribbed cuffs and hem hold their shape",
        "Woven brand label at the interior collar",
        "Imported — machine wash cold, hang to dry",
      ],
      sizeAndFit: [
        "Model is 186 cm and wears size M",
        "Relaxed, boxy fit — size down for a regular fit",
        "Drop shoulder with an extended body length",
      ],
      shippingAndReturns: [
        "Free express shipping on orders over €150",
        "Delivered in 2–4 business days",
        "Free 30-day returns on unworn items",
        "Every order ships carbon-neutral",
      ],
      color: "Color",
      size: "Size",
      select: "Select",
      addedToCart: "Added to Cart",
      selectSize: "Select a Size",
      outOfStock: "Out of Stock",
      addToCart: "Add to Cart",
      addToWishlist: "Add to wishlist",
      sku: "SKU",
      copySku: "Copy SKU",
      skuCopied: "Copied!",
      info: {
        freeShipping: {
          label: "Free Shipping",
          sub: "On orders over €150",
          sections: [
            {
              heading: "Standard Delivery",
              items: [
                "Orders over €150 ship free automatically — no code needed",
                "Orders under €150 have a flat €9.99 delivery fee",
                "Estimated delivery: 2–4 business days within the EU, 5–9 business days elsewhere",
                "Orders are packed and dispatched within 24 hours on business days",
              ],
            },
            {
              heading: "Order Tracking",
              items: [
                "You'll receive a tracking link by email as soon as your order ships",
                "Track your shipment any time from My Account → Order History",
                "Carriers used: DHL, DPD and national postal services, depending on destination",
              ],
            },
            {
              heading: "Customs & International Orders",
              items: [
                "Prices shown include VAT for EU destinations",
                "Orders shipped outside the EU may be subject to local import duties, payable by the customer",
                "Delivery times may vary for remote areas or during customs clearance",
              ],
            },
          ],
        },
        easyReturns: {
          label: "Easy Returns",
          sub: "30-day return policy",
          sections: [
            {
              heading: "Return Window",
              items: [
                "You have 30 days from the delivery date to request a return",
                "Items must be unworn, unwashed, and in their original packaging with tags attached",
                "Footwear must be tried on indoors only, on a clean surface",
              ],
            },
            {
              heading: "How to Return an Item",
              items: [
                "Go to My Account → Order History and select \"Request a Return\"",
                "Choose the item(s) and the reason for the return",
                "We'll email you a free prepaid return shipping label",
                "Drop the parcel off at any partner courier point within 14 days",
              ],
            },
            {
              heading: "Refunds",
              items: [
                "Refunds are issued to your original payment method",
                "Allow 3–5 business days for us to inspect the item once it's received",
                "Funds typically appear within 5–7 business days after the refund is issued",
              ],
            },
            {
              heading: "Exchanges & Exceptions",
              items: [
                "Need a different size instead? Request an exchange from the same screen — no extra shipping cost",
                "Final sale items (marked as such at checkout) cannot be returned or exchanged",
                "Gift cards and worn or washed items are not eligible for return",
              ],
            },
          ],
        },
        securePayment: {
          label: "Secure Payment",
          sub: "100% secure checkout",
          sections: [
            {
              heading: "Payment Methods",
              items: [
                "We accept Visa, Mastercard, American Express and major debit cards",
                "Apple Pay and Google Pay are supported at checkout",
              ],
            },
            {
              heading: "Data Security",
              items: [
                "Checkout is encrypted end-to-end (SSL/TLS)",
                "We never see or store your full card number",
                "Payments are processed by Stripe, a PCI-DSS Level 1 certified provider",
              ],
            },
            {
              heading: "Buyer Protection",
              items: [
                "3-D Secure verification is used on supported cards for extra protection",
                "If an item arrives damaged or incorrect, we cover the cost of return and replacement",
                "Our support team responds within 24 hours on business days",
              ],
            },
          ],
        },
      },
      relatedHeading: "You May Also Like",
      viewAll: "View All",
    },
    quickBuy: {
      cta: "Buy Now",
      title: "Buy Now",
      subtitle: "Leave your details and we'll call to confirm — no account needed.",
      fulfillment: "Delivery method",
      delivery: "Delivery",
      pickup: "Pickup",
      pickupNote: "Collect in person — we'll confirm the pickup point when we call you.",
      name: "Full Name",
      phone: "Phone",
      email: "Email (optional)",
      address: "Delivery Address",
      submit: "Place Order",
      submitting: "Placing order…",
      close: "Close",
      successTitle: "Request received!",
      successBody: (number: string) => `Order ${number} — our manager will call you shortly to confirm.`,
      errorGeneric: "Something went wrong — please try again.",
    },
    starRating: {
      reviews: (n: number) => `(${n} review${n === 1 ? "" : "s"})`,
    },
    cart: {
      title: "Your Cart",
      close: "Close cart",
      addMorePrefix: "Add",
      addMoreSuffix: "more for free shipping",
      freeShippingUnlocked: "You've unlocked free shipping!",
      empty: "Your cart is empty.",
      continueShopping: "Continue Shopping",
      subtotal: "Subtotal",
      shippingNote: "Shipping and taxes calculated at checkout.",
      checkout: "Checkout",
    },
    wishlist: {
      title: "Wishlist",
      close: "Close wishlist",
      empty: "Your wishlist is empty.",
      continueShopping: "Continue Shopping",
    },
    checkout: {
      title: "Checkout",
      signInRequired: {
        heading: "Sign In Required",
        body: "Please sign in to complete your order.",
        cta: "Sign In",
      },
      emptyCart: { heading: "Your Cart Is Empty", cta: "Continue Shopping" },
      shippingAddress: "Shipping Address",
      fullName: "Full Name",
      address: "Address",
      apartment: "Apartment, suite, etc. (optional)",
      city: "City",
      zip: "ZIP / Postal Code",
      country: "Country",
      phone: "Phone (optional)",
      placingOrder: "Redirecting to payment…",
      placeOrder: "Continue to Payment",
      paymentNotice: "You'll pay securely on Stripe's page — we never see your card details.",
      orderSummary: "Order Summary",
      subtotal: "Subtotal",
      shipping: "Shipping",
      total: "Total",
      free: "Free",
    },
    account: {
      title: "Account",
      signInPrompt: "Sign in to view your orders and account details.",
      signIn: "Sign In",
      createAccount: "Create Account",
      myAccount: "My Account",
      admin: "Admin",
      adminPanel: "Admin Panel",
      signOut: "Sign Out",
      orderHistory: "Order History",
      noOrders: "You haven't placed any orders yet.",
      startShopping: "Start shopping",
      item: "item",
      items: "items",
      statusLabels: {
        PENDING: "Pending",
        PAID: "Paid",
        FULFILLED: "Fulfilled",
        SHIPPED: "Shipped",
        DELIVERED: "Delivered",
        CANCELLED: "Cancelled",
        REFUNDED: "Refunded",
      },
    },
    orderConfirmation: {
      title: "Order Confirmed",
      placed: (number: string) => `Order ${number} has been placed.`,
      processingTitle: "Payment Processing",
      processingBody: (number: string) =>
        `We're confirming the payment for order ${number}. This page will update automatically.`,
      cancelledTitle: "Order Not Completed",
      cancelledBody: (number: string) =>
        `Order ${number} was cancelled. If you were charged, the money will be returned to your card.`,
      subtotal: "Subtotal",
      shipping: "Shipping",
      total: "Total",
      free: "Free",
      viewOrders: "View Orders",
      continueShopping: "Continue Shopping",
      backToCheckout: "Back to Checkout",
    },
    auth: {
      login: {
        title: "Sign In",
        testAccounts: "Test accounts: admin@offgrid.dev / customer@offgrid.dev — password123",
        email: "Email",
        password: "Password",
        signingIn: "Signing in…",
        signIn: "Sign In",
        noAccount: "Don't have an account?",
        createOne: "Create one",
      },
      register: {
        title: "Create Account",
        fullName: "Full Name",
        email: "Email",
        password: "Password",
        minChars: "At least 8 characters.",
        creating: "Creating account…",
        createAccount: "Create Account",
        haveAccount: "Already have an account?",
        signIn: "Sign in",
      },
    },
    about: {
      title: "About Us",
      p1: "OFFGRID is a multi-brand fashion store built for people who dress off the grid. We bring together streetwear, technical outerwear and statement pieces from Balenciaga, Nike, Puma, Stone Island, Off-White and more, under one roof.",
      p2: "Every item in the catalog is sourced and authenticated before it goes live, so you can shop with confidence whether you're after a daily staple or a rare drop.",
    },
    contact: {
      title: "Contact",
      intro: "Questions about an order or a product? Reach out any time.",
      emailLabel: "Email",
    },
  },
  ro: {
    nav: {
      home: "Acasă",
      shop: "Magazin",
      collections: "Colecții",
      aboutUs: "Despre noi",
      contact: "Contact",
      menu: "Meniu",
      closeMenu: "Închide meniul",
    },
    regionSwitcher: {
      trigger: "Limbă și regiune",
      language: "Limbă",
      region: "Regiune",
      selectLanguage: "Alege limba site-ului",
      selectRegion: "Alege regiunea",
      close: "Închide",
    },
    notificationBar: "Livrare gratuită la comenzi peste 150 €",
    hero: {
      eyebrow: "Noutăți",
      titleLine1: "Ieși din grid.",
      titleLine2: "Intră pe radar.",
      description:
        "Balenciaga, Nike, Stone Island și altele — autentificate, atent selecționate și prețuite corect pentru cei care chiar le poartă.",
      cta: "Cumpără acum",
    },
    features: {
      freeShipping: { title: "Livrare gratuită", text: "La comenzi peste 150 €" },
      premiumQuality: { title: "Calitate premium", text: "Autentificate și verificate" },
      easyReturns: { title: "Retur simplu", text: "Retur fără bătăi de cap în 30 de zile" },
      support: { title: "Suport 24/7", text: "Suntem aici să te ajutăm oricând" },
    },
    shopByCategory: {
      heading: "Cumpără pe categorii",
      viewAll: "Toate categoriile",
    },
    collectionsMarquee: {
      heading: "Explorează colecțiile",
    },
    trendingNow: {
      heading: "În tendințe",
      viewAll: "Vezi tot",
    },
    footer: {
      tagline:
        "Modă multi-brand pentru cei care ies din grid. Branduri atent alese, piese autentificate, livrare în toată lumea.",
      columns: {
        shop: {
          title: "Magazin",
          links: {
            allProducts: "Toate produsele",
            hoodies: "Hanorace",
            tshirts: "Tricouri",
            pants: "Pantaloni",
            jackets: "Geci",
            accessories: "Accesorii",
          },
        },
        company: {
          title: "Companie",
          links: {
            aboutUs: "Despre noi",
            contactUs: "Contactează-ne",
            shipping: "Livrare și expediere",
            returns: "Retur și rambursare",
            privacy: "Politica de confidențialitate",
          },
        },
        help: {
          title: "Ajutor",
          links: {
            faqs: "Întrebări frecvente",
            trackOrder: "Urmărește comanda",
            sizeGuide: "Ghid de mărimi",
            terms: "Termeni și condiții",
          },
        },
      },
      newsletter: {
        title: "Newsletter",
        blurb: "Primește noutăți exclusive despre lansări și oferte speciale.",
        placeholder: "Introdu adresa de email",
        subscribe: "Abonează-te",
      },
      rights: "Toate drepturile rezervate.",
    },
    megaMenu: {
      viewAll: "Vezi toate",
      genders: { men: "Bărbați", women: "Femei", unisex: "Unisex" },
      sections: {
        new: "Noutăți",
        clothing: "Îmbrăcăminte",
        shoes: "Încălțăminte",
        accessories: "Accesorii",
        brands: "Branduri",
        collections: "Colecții",
        sale: "Reduceri",
      },
      clothing: {
        tshirts: "Tricouri",
        shirts: "Cămăși",
        hoodies: "Hanorace",
        sweaters: "Pulovere",
        jackets: "Geci",
        coats: "Paltoane",
        jeans: "Blugi",
        pants: "Pantaloni",
        shorts: "Pantaloni scurți",
        dressesSkirts: "Rochii / Fuste",
      },
      shoes: {
        sneakers: "Adidași",
        canvasShoes: "Tenişi",
        boots: "Ghete",
        dressShoes: "Pantofi eleganți",
        sandals: "Sandale",
      },
      accessories: {
        bags: "Genți",
        backpacks: "Rucsacuri",
        belts: "Curele",
        wallets: "Portofele",
        sunglasses: "Ochelari de soare",
        headwear: "Pălării și șepci",
        watches: "Ceasuri",
        jewelry: "Bijuterii",
      },
    },
    catalog: {
      collections: "Colecții",
      allProducts: "Toate produsele",
      newArrivals: "Noutăți",
      sale: "Reduceri",
      itemsSuffix: "produse",
      noResults: "Niciun produs nu corespunde acestor filtre.",
      filters: {
        title: "Filtre",
        clearAll: "Șterge tot",
        gender: "Gen",
        category: "Categorie",
        brand: "Brand",
        size: "Mărime",
        color: "Culoare",
        price: "Preț",
        min: "Min",
        max: "Max",
        apply: "Aplică",
        showMore: "Arată tot",
        showLess: "Arată mai puțin",
      },
    },
    productCard: {
      featured: "Recomandat",
      sale: "Reducere",
      added: "Adăugat",
      addToCart: "Adaugă în coș",
      lowStock: (n: number) => `Mai sunt doar ${n}`,
    },
    productPage: {
      home: "Acasă",
      tabs: {
        details: "Detalii",
        materials: "Materiale",
        fit: "Mărime și potrivire",
        shipping: "Livrare și retur",
      },
      materials: [
        "Bumbac greu, spălat pentru un aspect purtat",
        "Manșetele și tivul reiate își păstrează forma",
        "Etichetă țesută a brandului în interiorul gulerului",
        "Import — se spală la mașină cu apă rece, se usucă pe umeraș",
      ],
      sizeAndFit: [
        "Modelul are 186 cm și poartă mărimea M",
        "Croială lejeră, oversized — alege o mărime mai mică pentru o croială obișnuită",
        "Umăr căzut cu lungime extinsă a corpului",
      ],
      shippingAndReturns: [
        "Livrare expres gratuită la comenzi peste 150 €",
        "Livrare în 2–4 zile lucrătoare",
        "Retur gratuit în 30 de zile pentru articolele nepurtate",
        "Fiecare comandă este expediată neutru din punct de vedere al carbonului",
      ],
      color: "Culoare",
      size: "Mărime",
      select: "Alege",
      addedToCart: "Adăugat în coș",
      selectSize: "Alege o mărime",
      outOfStock: "Stoc epuizat",
      addToCart: "Adaugă în coș",
      addToWishlist: "Adaugă la favorite",
      sku: "Cod produs",
      copySku: "Copiază codul",
      skuCopied: "Copiat!",
      info: {
        freeShipping: {
          label: "Livrare gratuită",
          sub: "La comenzi peste 150 €",
          sections: [
            {
              heading: "Livrare standard",
              items: [
                "Comenzile peste 150 € beneficiază automat de livrare gratuită — fără cod promoțional",
                "Comenzile sub 150 € au o taxă fixă de livrare de 9,99 €",
                "Livrare estimată: 2–4 zile lucrătoare în UE, 5–9 zile lucrătoare în restul lumii",
                "Comenzile sunt pregătite și expediate în 24 de ore în zilele lucrătoare",
              ],
            },
            {
              heading: "Urmărirea comenzii",
              items: [
                "Primești un link de urmărire pe email imediat ce comanda este expediată",
                "Poți urmări coletul oricând din Contul meu → Istoric comenzi",
                "Curieri folosiți: DHL, DPD și serviciile poștale naționale, în funcție de destinație",
              ],
            },
            {
              heading: "Vamă și comenzi internaționale",
              items: [
                "Prețurile afișate includ TVA pentru destinațiile din UE",
                "Comenzile expediate în afara UE pot fi supuse taxelor vamale locale, suportate de client",
                "Termenele de livrare pot varia pentru zone izolate sau în timpul vămuirii",
              ],
            },
          ],
        },
        easyReturns: {
          label: "Retur simplu",
          sub: "Politică de retur de 30 de zile",
          sections: [
            {
              heading: "Perioada de retur",
              items: [
                "Ai 30 de zile de la livrare pentru a solicita un retur",
                "Articolele trebuie să fie nepurtate, nespălate și în ambalajul original, cu etichetele atașate",
                "Încălțămintea se probează doar în casă, pe o suprafață curată",
              ],
            },
            {
              heading: "Cum returnezi un articol",
              items: [
                "Mergi la Contul meu → Istoric comenzi și alege „Solicită un retur”",
                "Selectează articolul (articolele) și motivul returului",
                "Îți trimitem pe email o etichetă de retur preplătită, gratuită",
                "Predă coletul la orice punct al curierului partener în 14 zile",
              ],
            },
            {
              heading: "Rambursări",
              items: [
                "Rambursarea se face către metoda de plată originală",
                "Verificarea articolului returnat durează 3–5 zile lucrătoare de la primire",
                "Suma ajunge de obicei în 5–7 zile lucrătoare de la emiterea rambursării",
              ],
            },
            {
              heading: "Schimburi și excepții",
              items: [
                "Ai nevoie de altă mărime? Solicită un schimb din același ecran — fără cost suplimentar de livrare",
                "Articolele de vânzare finală (marcate astfel la finalizarea comenzii) nu pot fi returnate sau schimbate",
                "Cardurile cadou și articolele purtate sau spălate nu sunt eligibile pentru retur",
              ],
            },
          ],
        },
        securePayment: {
          label: "Plată securizată",
          sub: "Finalizare comandă 100% sigură",
          sections: [
            {
              heading: "Metode de plată",
              items: [
                "Acceptăm Visa, Mastercard, American Express și principalele carduri de debit",
                "Apple Pay și Google Pay sunt disponibile la finalizarea comenzii",
              ],
            },
            {
              heading: "Securitatea datelor",
              items: [
                "Plata este criptată integral (SSL/TLS)",
                "Nu vedem și nu stocăm niciodată numărul complet al cardului tău",
                "Plățile sunt procesate de Stripe, furnizor certificat PCI-DSS nivel 1",
              ],
            },
            {
              heading: "Protecția cumpărătorului",
              items: [
                "Verificare 3-D Secure pentru cardurile compatibile, pentru protecție suplimentară",
                "Dacă un articol ajunge deteriorat sau greșit, acoperim costul de retur și înlocuire",
                "Echipa de suport răspunde în 24 de ore în zilele lucrătoare",
              ],
            },
          ],
        },
      },
      relatedHeading: "S-ar putea să-ți placă și",
      viewAll: "Vezi tot",
    },
    quickBuy: {
      cta: "Cumpără acum",
      title: "Cumpără acum",
      subtitle: "Lasă-ți datele și te sunăm să confirmăm — fără cont.",
      fulfillment: "Metodă de livrare",
      delivery: "Livrare",
      pickup: "Ridicare personală",
      pickupNote: "Ridici personal comanda — confirmăm punctul de ridicare la telefon.",
      name: "Nume complet",
      phone: "Telefon",
      email: "Email (opțional)",
      address: "Adresă de livrare",
      submit: "Plasează comanda",
      submitting: "Se plasează comanda…",
      close: "Închide",
      successTitle: "Cerere primită!",
      successBody: (number: string) =>
        `Comanda ${number} — managerul nostru te sună în curând pentru confirmare.`,
      errorGeneric: "A apărut o eroare — încearcă din nou.",
    },
    starRating: {
      reviews: (n: number) => `(${n} ${n === 1 ? "recenzie" : "recenzii"})`,
    },
    cart: {
      title: "Coșul tău",
      close: "Închide coșul",
      addMorePrefix: "Mai adaugă",
      addMoreSuffix: "pentru livrare gratuită",
      freeShippingUnlocked: "Ai deblocat livrarea gratuită!",
      empty: "Coșul tău este gol.",
      continueShopping: "Continuă cumpărăturile",
      subtotal: "Subtotal",
      shippingNote: "Livrarea și taxele se calculează la finalizarea comenzii.",
      checkout: "Finalizează comanda",
    },
    wishlist: {
      title: "Favorite",
      close: "Închide favoritele",
      empty: "Lista de favorite este goală.",
      continueShopping: "Continuă cumpărăturile",
    },
    checkout: {
      title: "Finalizare comandă",
      signInRequired: {
        heading: "Este necesară autentificarea",
        body: "Te rugăm să te autentifici pentru a finaliza comanda.",
        cta: "Autentificare",
      },
      emptyCart: { heading: "Coșul tău este gol", cta: "Continuă cumpărăturile" },
      shippingAddress: "Adresă de livrare",
      fullName: "Nume complet",
      address: "Adresă",
      apartment: "Apartament, etc. (opțional)",
      city: "Oraș",
      zip: "Cod poștal",
      country: "Țară",
      phone: "Telefon (opțional)",
      placingOrder: "Se redirecționează către plată…",
      placeOrder: "Continuă spre plată",
      paymentNotice: "Vei plăti în siguranță pe pagina Stripe — nu vedem datele cardului tău.",
      orderSummary: "Sumarul comenzii",
      subtotal: "Subtotal",
      shipping: "Livrare",
      total: "Total",
      free: "Gratuit",
    },
    account: {
      title: "Cont",
      signInPrompt: "Autentifică-te pentru a vedea comenzile și detaliile contului.",
      signIn: "Autentificare",
      createAccount: "Creează cont",
      myAccount: "Contul meu",
      admin: "Admin",
      adminPanel: "Panou admin",
      signOut: "Deconectare",
      orderHistory: "Istoric comenzi",
      noOrders: "Nu ai plasat nicio comandă încă.",
      startShopping: "Începe cumpărăturile",
      item: "produs",
      items: "produse",
      statusLabels: {
        PENDING: "În așteptare",
        PAID: "Plătită",
        FULFILLED: "Pregătită",
        SHIPPED: "Expediată",
        DELIVERED: "Livrată",
        CANCELLED: "Anulată",
        REFUNDED: "Rambursată",
      },
    },
    orderConfirmation: {
      title: "Comandă confirmată",
      placed: (number: string) => `Comanda ${number} a fost plasată.`,
      processingTitle: "Plata se procesează",
      processingBody: (number: string) =>
        `Confirmăm plata pentru comanda ${number}. Pagina se va actualiza automat.`,
      cancelledTitle: "Comandă neînfinalizată",
      cancelledBody: (number: string) =>
        `Comanda ${number} a fost anulată. Dacă ți s-au retras bani, aceștia vor fi returnați pe card.`,
      subtotal: "Subtotal",
      shipping: "Livrare",
      total: "Total",
      free: "Gratuit",
      viewOrders: "Vezi comenzile",
      continueShopping: "Continuă cumpărăturile",
      backToCheckout: "Înapoi la finalizare",
    },
    auth: {
      login: {
        title: "Autentificare",
        testAccounts: "Conturi de test: admin@offgrid.dev / customer@offgrid.dev — password123",
        email: "Email",
        password: "Parolă",
        signingIn: "Se autentifică…",
        signIn: "Autentificare",
        noAccount: "Nu ai cont?",
        createOne: "Creează unul",
      },
      register: {
        title: "Creează cont",
        fullName: "Nume complet",
        email: "Email",
        password: "Parolă",
        minChars: "Minimum 8 caractere.",
        creating: "Se creează contul…",
        createAccount: "Creează cont",
        haveAccount: "Ai deja cont?",
        signIn: "Autentifică-te",
      },
    },
    about: {
      title: "Despre noi",
      p1: "OFFGRID este un magazin de modă multi-brand creat pentru cei care ies din grid. Reunim streetwear, îmbrăcăminte tehnică outdoor și piese statement de la Balenciaga, Nike, Puma, Stone Island, Off-White și altele, sub un singur acoperiș.",
      p2: "Fiecare articol din catalog este verificat și autentificat înainte de publicare, ca să poți cumpăra cu încredere, fie că vrei o piesă de zi cu zi, fie una rară.",
    },
    contact: {
      title: "Contact",
      intro: "Ai întrebări despre o comandă sau un produs? Scrie-ne oricând.",
      emailLabel: "Email",
    },
  },
  ru: {
    nav: {
      home: "Главная",
      shop: "Магазин",
      collections: "Коллекции",
      aboutUs: "О нас",
      contact: "Контакты",
      menu: "Меню",
      closeMenu: "Закрыть меню",
    },
    regionSwitcher: {
      trigger: "Язык и регион",
      language: "Язык",
      region: "Регион",
      selectLanguage: "Выберите язык сайта",
      selectRegion: "Выберите регион",
      close: "Закрыть",
    },
    notificationBar: "Бесплатная доставка при заказе от 150 €",
    hero: {
      eyebrow: "Новинки",
      titleLine1: "Вне сети.",
      titleLine2: "В центре внимания.",
      description:
        "Balenciaga, Nike, Stone Island и другие — подлинные, тщательно отобранные вещи по честной цене для тех, кто их действительно носит.",
      cta: "В магазин",
    },
    features: {
      freeShipping: { title: "Бесплатная доставка", text: "При заказе от 150 €" },
      premiumQuality: { title: "Премиальное качество", text: "Подлинность и качество проверены" },
      easyReturns: { title: "Лёгкий возврат", text: "Возврат в течение 30 дней без хлопот" },
      support: { title: "Поддержка 24/7", text: "Мы всегда готовы помочь" },
    },
    shopByCategory: {
      heading: "Покупки по категориям",
      viewAll: "Все категории",
    },
    collectionsMarquee: {
      heading: "Все коллекции",
    },
    trendingNow: {
      heading: "В тренде",
      viewAll: "Смотреть все",
    },
    footer: {
      tagline:
        "Мультибрендовая мода для тех, кто живёт вне рамок. Отобранные бренды, подлинные вещи, доставка по всему миру.",
      columns: {
        shop: {
          title: "Магазин",
          links: {
            allProducts: "Все товары",
            hoodies: "Худи",
            tshirts: "Футболки",
            pants: "Брюки",
            jackets: "Куртки",
            accessories: "Аксессуары",
          },
        },
        company: {
          title: "Компания",
          links: {
            aboutUs: "О нас",
            contactUs: "Связаться с нами",
            shipping: "Доставка",
            returns: "Возврат и возмещение",
            privacy: "Политика конфиденциальности",
          },
        },
        help: {
          title: "Помощь",
          links: {
            faqs: "Частые вопросы",
            trackOrder: "Отследить заказ",
            sizeGuide: "Таблица размеров",
            terms: "Условия использования",
          },
        },
      },
      newsletter: {
        title: "Рассылка",
        blurb: "Узнавайте первыми о новых поступлениях и акциях.",
        placeholder: "Введите email",
        subscribe: "Подписаться",
      },
      rights: "Все права защищены.",
    },
    megaMenu: {
      viewAll: "Смотреть все",
      genders: { men: "Мужчины", women: "Женщины", unisex: "Унисекс" },
      sections: {
        new: "Новинки",
        clothing: "Одежда",
        shoes: "Обувь",
        accessories: "Аксессуары",
        brands: "Бренды",
        collections: "Коллекции",
        sale: "Скидки",
      },
      clothing: {
        tshirts: "Футболки",
        shirts: "Рубашки",
        hoodies: "Худи и свитшоты",
        sweaters: "Свитера",
        jackets: "Куртки",
        coats: "Пальто",
        jeans: "Джинсы",
        pants: "Брюки",
        shorts: "Шорты",
        dressesSkirts: "Платья / юбки",
      },
      shoes: {
        sneakers: "Кроссовки",
        canvasShoes: "Кеды",
        boots: "Ботинки",
        dressShoes: "Туфли",
        sandals: "Сандалии",
      },
      accessories: {
        bags: "Сумки",
        backpacks: "Рюкзаки",
        belts: "Ремни",
        wallets: "Кошельки",
        sunglasses: "Очки",
        headwear: "Головные уборы",
        watches: "Часы",
        jewelry: "Украшения",
      },
    },
    catalog: {
      collections: "Коллекции",
      allProducts: "Все товары",
      newArrivals: "Новинки",
      sale: "Скидки",
      itemsSuffix: "товаров",
      noResults: "Нет товаров, соответствующих этим фильтрам.",
      filters: {
        title: "Фильтры",
        clearAll: "Сбросить всё",
        gender: "Пол",
        category: "Категория",
        brand: "Бренд",
        size: "Размер",
        color: "Цвет",
        price: "Цена",
        min: "От",
        max: "До",
        apply: "Применить",
        showMore: "Показать все",
        showLess: "Свернуть",
      },
    },
    productCard: {
      featured: "Хит",
      sale: "Скидка",
      added: "Добавлено",
      addToCart: "В корзину",
      lowStock: (n: number) => `Осталось всего ${n}`,
    },
    productPage: {
      home: "Главная",
      tabs: {
        details: "Детали",
        materials: "Материалы",
        fit: "Размер и посадка",
        shipping: "Доставка и возврат",
      },
      materials: [
        "Плотный хлопок, стирка для эффекта уже ношенной вещи",
        "Резинка на манжетах и подоле держит форму",
        "Тканая нашивка бренда на внутренней стороне воротника",
        "Импорт — машинная стирка в холодной воде, сушка на плечиках",
      ],
      sizeAndFit: [
        "Рост модели 186 см, размер M",
        "Свободный, прямой крой — берите на размер меньше для обычной посадки",
        "Заниженная линия плеча, удлинённый силуэт",
      ],
      shippingAndReturns: [
        "Бесплатная экспресс-доставка при заказе от 150 €",
        "Доставка за 2–4 рабочих дня",
        "Бесплатный возврат в течение 30 дней для неношеных вещей",
        "Каждый заказ доставляется с нулевым углеродным следом",
      ],
      color: "Цвет",
      size: "Размер",
      select: "Выбрать",
      addedToCart: "Добавлено в корзину",
      selectSize: "Выберите размер",
      outOfStock: "Нет в наличии",
      addToCart: "В корзину",
      addToWishlist: "В избранное",
      sku: "Артикул",
      copySku: "Скопировать артикул",
      skuCopied: "Скопировано!",
      info: {
        freeShipping: {
          label: "Бесплатная доставка",
          sub: "При заказе от 150 €",
          sections: [
            {
              heading: "Стандартная доставка",
              items: [
                "При заказе от 150 € доставка бесплатна автоматически — промокод не нужен",
                "Доставка заказов до 150 € стоит фиксированные 9,99 €",
                "Ориентировочный срок: 2–4 рабочих дня по ЕС, 5–9 рабочих дней в остальные страны",
                "Заказы собираются и отправляются в течение 24 часов в рабочие дни",
              ],
            },
            {
              heading: "Отслеживание заказа",
              items: [
                "Ссылку для отслеживания пришлём на email сразу после отправки",
                "Отследить посылку можно в любое время в Личном кабинете → История заказов",
                "Используемые службы: DHL, DPD и национальные почтовые службы — в зависимости от страны",
              ],
            },
            {
              heading: "Таможня и международные заказы",
              items: [
                "Указанные цены включают НДС для стран ЕС",
                "Заказы за пределы ЕС могут облагаться местными пошлинами — они оплачиваются покупателем",
                "Сроки доставки могут отличаться для удалённых регионов или при таможенном оформлении",
              ],
            },
          ],
        },
        easyReturns: {
          label: "Лёгкий возврат",
          sub: "Возврат в течение 30 дней",
          sections: [
            {
              heading: "Срок возврата",
              items: [
                "30 дней с момента получения, чтобы оформить возврат",
                "Вещь должна быть неношеной, нестиранной, в оригинальной упаковке с сохранёнными бирками",
                "Обувь можно примерять только дома на чистой поверхности",
              ],
            },
            {
              heading: "Как оформить возврат",
              items: [
                "Зайдите в Личный кабинет → История заказов и выберите «Оформить возврат»",
                "Выберите товар(ы) и причину возврата",
                "Мы пришлём на email бесплатную предоплаченную этикетку для возврата",
                "Сдайте посылку в любой пункт партнёрской курьерской службы в течение 14 дней",
              ],
            },
            {
              heading: "Возврат средств",
              items: [
                "Деньги возвращаются на исходный способ оплаты",
                "Проверка возвращённого товара занимает 3–5 рабочих дней после получения",
                "Средства обычно поступают в течение 5–7 рабочих дней после оформления возврата",
              ],
            },
            {
              heading: "Обмен и исключения",
              items: [
                "Нужен другой размер? Оформите обмен в том же разделе — без доплаты за доставку",
                "Товары финальной распродажи (отмечены при оформлении заказа) возврату и обмену не подлежат",
                "Подарочные карты и ношеные/стираные вещи возврату не подлежат",
              ],
            },
          ],
        },
        securePayment: {
          label: "Безопасная оплата",
          sub: "100% защищённая оплата",
          sections: [
            {
              heading: "Способы оплаты",
              items: [
                "Принимаем Visa, Mastercard, American Express и основные дебетовые карты",
                "При оформлении заказа доступны Apple Pay и Google Pay",
              ],
            },
            {
              heading: "Безопасность данных",
              items: [
                "Оплата полностью зашифрована (SSL/TLS)",
                "Мы никогда не видим и не храним полный номер карты",
                "Платежи обрабатывает Stripe — провайдер с сертификатом PCI-DSS уровня 1",
              ],
            },
            {
              heading: "Защита покупателя",
              items: [
                "Для поддерживаемых карт используется дополнительная проверка 3-D Secure",
                "Если товар придёт повреждённым или не тем, мы оплатим возврат и замену",
                "Служба поддержки отвечает в течение 24 часов в рабочие дни",
              ],
            },
          ],
        },
      },
      relatedHeading: "Вам может понравиться",
      viewAll: "Смотреть все",
    },
    quickBuy: {
      cta: "Купить в 1 клик",
      title: "Купить в 1 клик",
      subtitle: "Оставьте контакты — перезвоним для подтверждения, аккаунт не нужен.",
      fulfillment: "Способ получения",
      delivery: "Доставка",
      pickup: "Самовывоз",
      pickupNote: "Заберёте заказ лично — пункт выдачи согласуем по телефону.",
      name: "Имя",
      phone: "Телефон",
      email: "Email (необязательно)",
      address: "Адрес доставки",
      submit: "Оформить заказ",
      submitting: "Оформляем заказ…",
      close: "Закрыть",
      successTitle: "Заявка принята!",
      successBody: (number: string) => `Заказ ${number} — наш менеджер скоро позвонит для подтверждения.`,
      errorGeneric: "Что-то пошло не так — попробуйте ещё раз.",
    },
    starRating: {
      reviews: (n: number) => {
        const mod10 = n % 10;
        const mod100 = n % 100;
        const word =
          mod100 >= 11 && mod100 <= 14
            ? "отзывов"
            : mod10 === 1
              ? "отзыв"
              : mod10 >= 2 && mod10 <= 4
                ? "отзыва"
                : "отзывов";
        return `(${n} ${word})`;
      },
    },
    cart: {
      title: "Ваша корзина",
      close: "Закрыть корзину",
      addMorePrefix: "Добавьте ещё",
      addMoreSuffix: "для бесплатной доставки",
      freeShippingUnlocked: "Бесплатная доставка активирована!",
      empty: "Ваша корзина пуста.",
      continueShopping: "Продолжить покупки",
      subtotal: "Промежуточный итог",
      shippingNote: "Доставка и налоги рассчитываются при оформлении заказа.",
      checkout: "Оформить заказ",
    },
    wishlist: {
      title: "Избранное",
      close: "Закрыть избранное",
      empty: "В избранном пока пусто.",
      continueShopping: "Продолжить покупки",
    },
    checkout: {
      title: "Оформление заказа",
      signInRequired: {
        heading: "Требуется вход",
        body: "Пожалуйста, войдите, чтобы оформить заказ.",
        cta: "Войти",
      },
      emptyCart: { heading: "Ваша корзина пуста", cta: "Продолжить покупки" },
      shippingAddress: "Адрес доставки",
      fullName: "Полное имя",
      address: "Адрес",
      apartment: "Квартира и т.д. (необязательно)",
      city: "Город",
      zip: "Почтовый индекс",
      country: "Страна",
      phone: "Телефон (необязательно)",
      placingOrder: "Переходим к оплате…",
      placeOrder: "Перейти к оплате",
      paymentNotice: "Оплата проходит на защищённой странице Stripe — данные вашей карты нам недоступны.",
      orderSummary: "Сводка заказа",
      subtotal: "Промежуточный итог",
      shipping: "Доставка",
      total: "Итого",
      free: "Бесплатно",
    },
    account: {
      title: "Аккаунт",
      signInPrompt: "Войдите, чтобы увидеть свои заказы и данные аккаунта.",
      signIn: "Войти",
      createAccount: "Создать аккаунт",
      myAccount: "Мой аккаунт",
      admin: "Админ",
      adminPanel: "Панель администратора",
      signOut: "Выйти",
      orderHistory: "История заказов",
      noOrders: "Вы ещё не сделали ни одного заказа.",
      startShopping: "Начать покупки",
      item: "товар",
      items: "товаров",
      statusLabels: {
        PENDING: "В обработке",
        PAID: "Оплачен",
        FULFILLED: "Собран",
        SHIPPED: "Отправлен",
        DELIVERED: "Доставлен",
        CANCELLED: "Отменён",
        REFUNDED: "Возвращён",
      },
    },
    orderConfirmation: {
      title: "Заказ подтверждён",
      placed: (number: string) => `Заказ ${number} оформлен.`,
      processingTitle: "Платёж обрабатывается",
      processingBody: (number: string) =>
        `Подтверждаем оплату заказа ${number}. Страница обновится автоматически.`,
      cancelledTitle: "Заказ не завершён",
      cancelledBody: (number: string) =>
        `Заказ ${number} отменён. Если деньги были списаны, они вернутся на вашу карту.`,
      subtotal: "Промежуточный итог",
      shipping: "Доставка",
      total: "Итого",
      free: "Бесплатно",
      viewOrders: "Мои заказы",
      continueShopping: "Продолжить покупки",
      backToCheckout: "Вернуться к оформлению",
    },
    auth: {
      login: {
        title: "Вход",
        testAccounts: "Тестовые аккаунты: admin@offgrid.dev / customer@offgrid.dev — password123",
        email: "Email",
        password: "Пароль",
        signingIn: "Выполняется вход…",
        signIn: "Войти",
        noAccount: "Нет аккаунта?",
        createOne: "Создать",
      },
      register: {
        title: "Создать аккаунт",
        fullName: "Полное имя",
        email: "Email",
        password: "Пароль",
        minChars: "Минимум 8 символов.",
        creating: "Создаём аккаунт…",
        createAccount: "Создать аккаунт",
        haveAccount: "Уже есть аккаунт?",
        signIn: "Войти",
      },
    },
    about: {
      title: "О нас",
      p1: "OFFGRID — мультибрендовый магазин одежды для тех, кто живёт вне рамок. Мы собрали в одном месте стритвир, техничную верхнюю одежду и знаковые вещи от Balenciaga, Nike, Puma, Stone Island, Off-White и других брендов.",
      p2: "Каждый товар в каталоге проходит проверку и подтверждение подлинности перед публикацией — покупайте уверенно, ищете ли вы вещь на каждый день или редкий дроп.",
    },
    contact: {
      title: "Контакты",
      intro: "Вопросы о заказе или товаре? Пишите в любое время.",
      emailLabel: "Email",
    },
  },
};

export type Dictionary = (typeof translations)["en"];

/**
 * Maps category slugs (from `prisma/seed.ts`) to their `megaMenu` translation,
 * so the storefront can show a localized label for what is otherwise an
 * untranslated database name (see the note atop `translations`).
 */
const CATEGORY_LABEL_BY_SLUG: Record<string, (mm: Dictionary["megaMenu"]) => string> = {
  clothing: (mm) => mm.sections.clothing,
  shoes: (mm) => mm.sections.shoes,
  accessories: (mm) => mm.sections.accessories,
  tshirts: (mm) => mm.clothing.tshirts,
  shirts: (mm) => mm.clothing.shirts,
  hoodies: (mm) => mm.clothing.hoodies,
  sweaters: (mm) => mm.clothing.sweaters,
  jackets: (mm) => mm.clothing.jackets,
  coats: (mm) => mm.clothing.coats,
  jeans: (mm) => mm.clothing.jeans,
  pants: (mm) => mm.clothing.pants,
  shorts: (mm) => mm.clothing.shorts,
  "dresses-skirts": (mm) => mm.clothing.dressesSkirts,
  sneakers: (mm) => mm.shoes.sneakers,
  "canvas-shoes": (mm) => mm.shoes.canvasShoes,
  boots: (mm) => mm.shoes.boots,
  "dress-shoes": (mm) => mm.shoes.dressShoes,
  sandals: (mm) => mm.shoes.sandals,
  bags: (mm) => mm.accessories.bags,
  backpacks: (mm) => mm.accessories.backpacks,
  belts: (mm) => mm.accessories.belts,
  wallets: (mm) => mm.accessories.wallets,
  sunglasses: (mm) => mm.accessories.sunglasses,
  headwear: (mm) => mm.accessories.headwear,
  watches: (mm) => mm.accessories.watches,
  jewelry: (mm) => mm.accessories.jewelry,
};

/** Localizes a category name by slug, falling back to the database name for anything not in the map. */
export function categoryLabel(slug: string, fallbackName: string, dict: Dictionary): string {
  return CATEGORY_LABEL_BY_SLUG[slug]?.(dict.megaMenu) ?? fallbackName;
}

/**
 * Reads the region store and returns the current language code. Falls back
 * to the default region's language until mount (the persisted region is
 * only known client-side), same hydration-safety pattern as `CartIndicator`.
 */
export function useLang(): Lang {
  const code = useRegionStore((s) => s.code);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return regionByCode(mounted ? code : DEFAULT_REGION_CODE).lang;
}

export function useTranslations(): Dictionary {
  return translations[useLang()];
}

/* -------------------------------------------------------------------------- */
/*  Product type label ("Men's T-Shirt" / "женская куртка" / "Rochie pentru femei") */
/* -------------------------------------------------------------------------- */

type Lang = "en" | "ro" | "ru";

/** Russian grammatical class of the category's singular noun, for adjective agreement. */
type RuForm = "m" | "f" | "n" | "pl";

type ProductTypeEntry = { en: string; ro: string; ru: string; ruForm: RuForm };

/**
 * One representative singular noun per leaf category (from `prisma/seed.ts`),
 * used to build a "gender + garment" label on product cards. A few categories
 * bundle more than one garment shape (see `dresses-skirts` below, handled
 * separately) — for the rest (`headwear`, `jewelry`) this picks the closest
 * generic noun rather than the exact item, which is close enough for a card
 * caption.
 */
const PRODUCT_TYPE_BY_SLUG: Record<string, ProductTypeEntry> = {
  tshirts: { en: "T-Shirt", ro: "Tricou", ru: "футболка", ruForm: "f" },
  shirts: { en: "Shirt", ro: "Cămașă", ru: "рубашка", ruForm: "f" },
  hoodies: { en: "Hoodie", ro: "Hanorac", ru: "худи", ruForm: "n" },
  sweaters: { en: "Sweater", ro: "Pulover", ru: "свитер", ruForm: "m" },
  jackets: { en: "Jacket", ro: "Geacă", ru: "куртка", ruForm: "f" },
  coats: { en: "Coat", ro: "Palton", ru: "пальто", ruForm: "n" },
  jeans: { en: "Jeans", ro: "Blugi", ru: "джинсы", ruForm: "pl" },
  pants: { en: "Pants", ro: "Pantaloni", ru: "брюки", ruForm: "pl" },
  shorts: { en: "Shorts", ro: "Pantaloni scurți", ru: "шорты", ruForm: "pl" },
  sneakers: { en: "Sneakers", ro: "Adidași", ru: "кроссовки", ruForm: "pl" },
  "canvas-shoes": { en: "Canvas Shoes", ro: "Tenişi", ru: "кеды", ruForm: "pl" },
  boots: { en: "Boots", ro: "Ghete", ru: "ботинки", ruForm: "pl" },
  "dress-shoes": { en: "Dress Shoes", ro: "Pantofi eleganți", ru: "туфли", ruForm: "pl" },
  sandals: { en: "Sandals", ro: "Sandale", ru: "сандалии", ruForm: "pl" },
  bags: { en: "Bag", ro: "Geantă", ru: "сумка", ruForm: "f" },
  backpacks: { en: "Backpack", ro: "Rucsac", ru: "рюкзак", ruForm: "m" },
  belts: { en: "Belt", ro: "Curea", ru: "ремень", ruForm: "m" },
  wallets: { en: "Wallet", ro: "Portofel", ru: "кошелёк", ruForm: "m" },
  sunglasses: { en: "Sunglasses", ro: "Ochelari de soare", ru: "очки", ruForm: "pl" },
  headwear: { en: "Cap", ro: "Șapcă", ru: "кепка", ruForm: "f" },
  watches: { en: "Watch", ro: "Ceas", ru: "часы", ruForm: "pl" },
  jewelry: { en: "Jewelry", ro: "Bijuterie", ru: "украшение", ruForm: "n" },
};

/** "dresses-skirts" bundles two different garments — pick the noun from the product's own name. */
function dressesOrSkirtsEntry(productName: string): ProductTypeEntry {
  const isSkirt = productName.toLowerCase().includes("skirt");
  return isSkirt
    ? { en: "Skirt", ro: "Fustă", ru: "юбка", ruForm: "f" }
    : { en: "Dress", ro: "Rochie", ru: "платье", ruForm: "n" };
}

const GENDER_PREFIX_EN: Record<Gender, string> = { MEN: "Men's", WOMEN: "Women's", UNISEX: "Unisex" };
const GENDER_SUFFIX_RO: Record<Gender, string> = {
  MEN: "pentru bărbați",
  WOMEN: "pentru femei",
  UNISEX: "unisex",
};
/** "унисекс" doesn't decline in Russian, so it stands in for every grammatical form. */
const RU_ADJECTIVE: Record<Gender, Record<RuForm, string>> = {
  MEN: { m: "мужской", f: "мужская", n: "мужское", pl: "мужские" },
  WOMEN: { m: "женский", f: "женская", n: "женское", pl: "женские" },
  UNISEX: { m: "унисекс", f: "унисекс", n: "унисекс", pl: "унисекс" },
};

/**
 * Localized "gender + garment" card caption, e.g. "Men's T-Shirt" / "женская
 * куртка" / "Rochie pentru femei". Returns null for an unrecognized category
 * slug so the caller can just skip rendering it.
 */
export function productTypeLabel(
  categorySlug: string,
  gender: Gender,
  productName: string,
  lang: Lang,
): string | null {
  const entry =
    categorySlug === "dresses-skirts"
      ? dressesOrSkirtsEntry(productName)
      : PRODUCT_TYPE_BY_SLUG[categorySlug];
  if (!entry) return null;

  if (lang === "en") return `${GENDER_PREFIX_EN[gender]} ${entry.en}`;
  if (lang === "ro") return `${entry.ro} ${GENDER_SUFFIX_RO[gender]}`;
  return `${RU_ADJECTIVE[gender][entry.ruForm]} ${entry.ru}`;
}
