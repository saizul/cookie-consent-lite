import type { Strings } from './types.js';

/** English texts. */
export const en: Strings = {
  bannerTitle: 'We use cookies',
  bannerText:
    'We use necessary cookies to make this site work. With your permission we would also like to use analytics and marketing cookies to improve it.',
  acceptAll: 'Accept all',
  rejectAll: 'Reject all',
  preferences: 'Preferences',
  modalTitle: 'Cookie preferences',
  modalText: 'Choose which cookies you allow. You can change your choice at any time.',
  save: 'Save choices',
  close: 'Close',
  policyLink: 'Cookie policy',
  alwaysOn: 'Always on',
  gpcNote: 'Off because your browser sends a Global Privacy Control signal.',
  categories: {
    necessary: {
      title: 'Necessary',
      description: 'Needed for the site to work, for example security and remembering this choice.',
    },
    analytics: {
      title: 'Analytics',
      description: 'Help us understand how visitors use the site so we can improve it.',
    },
    marketing: {
      title: 'Marketing',
      description: 'Used to show relevant ads and measure how well they work.',
    },
    functional: {
      title: 'Functional',
      description: 'Remember extra settings such as language or region, and personalise the site.',
    },
  },
};

/** Bangla (বাংলা) texts. */
export const bn: Strings = {
  bannerTitle: 'আমরা কুকি ব্যবহার করি',
  bannerText:
    'সাইটটি চালাতে আমরা প্রয়োজনীয় কুকি ব্যবহার করি। আপনার অনুমতি পেলে সাইট উন্নত করতে অ্যানালিটিক্স ও মার্কেটিং কুকিও ব্যবহার করতে চাই।',
  acceptAll: 'সব গ্রহণ করুন',
  rejectAll: 'সব প্রত্যাখ্যান করুন',
  preferences: 'পছন্দ বাছাই',
  modalTitle: 'কুকি পছন্দসমূহ',
  modalText: 'কোন কুকি অনুমোদন করবেন তা বেছে নিন। যেকোনো সময় এটি পরিবর্তন করতে পারবেন।',
  save: 'পছন্দ সংরক্ষণ করুন',
  close: 'বন্ধ করুন',
  policyLink: 'কুকি নীতি',
  alwaysOn: 'সবসময় চালু',
  gpcNote: 'আপনার ব্রাউজার Global Privacy Control সংকেত পাঠাচ্ছে, তাই এটি বন্ধ রাখা হয়েছে।',
  categories: {
    necessary: {
      title: 'প্রয়োজনীয়',
      description: 'সাইট চালানোর জন্য দরকারি, যেমন নিরাপত্তা এবং আপনার এই পছন্দ মনে রাখা।',
    },
    analytics: {
      title: 'অ্যানালিটিক্স',
      description: 'ভিজিটররা সাইট কীভাবে ব্যবহার করেন তা বুঝতে সাহায্য করে, যাতে আমরা এটি উন্নত করতে পারি।',
    },
    marketing: {
      title: 'মার্কেটিং',
      description: 'প্রাসঙ্গিক বিজ্ঞাপন দেখাতে এবং বিজ্ঞাপনের কার্যকারিতা মাপতে ব্যবহৃত হয়।',
    },
    functional: {
      title: 'ফাংশনাল',
      description: 'ভাষা বা অঞ্চলের মতো বাড়তি সেটিংস মনে রাখে এবং সাইটকে আপনার মতো করে সাজায়।',
    },
  },
};

/** Built-in languages. */
export const translations: Record<string, Strings> = { en, bn };
