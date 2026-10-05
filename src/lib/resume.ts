/**
 * Melissa's CV, transcribed from public/resume.pdf ("RESUME - Art Director -
 * Melissa Encarnación 2026", one page). /resume renders it. To update the CV:
 * replace the PDF and edit this file to match it, word for word; don't
 * reword here what the PDF says.
 */

export interface Role {
  title: string;
  /** Absent when the PDF gives none (Serra SRL). */
  dates?: string;
}

export interface Job {
  org: string;
  /** "Freelance", set bold under the company like in the PDF. */
  kind?: string;
  /** Newest first. Several roles = promotions at the same company. */
  roles: Role[];
}

export interface Study {
  school: string;
  program: string;
  /** The line under the program, its parts separated by " | " in the PDF. */
  detail: string[];
}

export interface Resume {
  name: string;
  title: string;
  summary: string;
  experience: Job[];
  education: Study[];
  skills: string[];
  programs: string[];
  contact: { portfolio: string; email: string; phone: string; location: string; linkedin: string };
}

export const RESUME: Resume = {
  name: 'Melissa Encarnación',
  title: 'Head of design',
  summary:
    'Graphic designer and Art director specialized in visual identity, branding, and advertising design. I help brands build a cohesive, functional, and visually compelling image aligned with their goals and values.',
  experience: [
    {
      org: 'Liquid Digital Agency',
      roles: [
        { title: 'Head of Design', dates: '2024 – Present' },
        { title: 'Art Director', dates: '2022 – 2024' },
        { title: 'Graphic Designer', dates: '2019 – 2022' },
      ],
    },
    {
      org: 'Hey Marcas / El Snack Report',
      kind: 'Freelance',
      roles: [{ title: 'Art director', dates: '2021 – Present' }],
    },
    {
      org: 'Castellanos Comunicaciones',
      kind: 'Freelance',
      roles: [{ title: 'Podcasts Brand Designer', dates: '2024 – 2026' }],
    },
    { org: 'Pagés BBDO', roles: [{ title: 'Visual Designer', dates: '2018 – 2019' }] },
    { org: 'Ogilvy Dominicana', roles: [{ title: 'Digital Designer', dates: '2016 – 2018' }] },
    { org: 'Serra SRL', roles: [{ title: 'Graphic Designer & Marketing Assistant' }] },
  ],
  education: [
    {
      school: 'Coursera',
      program: 'Google UX Design Professional Certificate',
      detail: ['Expected completion: December 2026'],
    },
    { school: 'Miami AD School P.C.', program: 'Liquid Creative Edge', detail: ['Course', '2026'] },
    { school: 'Congo Films', program: 'Art direction for Set Design', detail: ['Course', 'March 2024'] },
    { school: 'Google Skillshop', program: 'Fundamentals of Digital Marketing', detail: ['Workshop', 'Nov. 2023'] },
    { school: 'La Pieza', program: 'Art direction for Set Design', detail: ['Workshop', '2023'] },
    { school: 'Brother Santo Domingo', program: 'Art Direction', detail: ['2015'] },
    { school: 'Universidad APEC', program: "Bachelor's Degree, Advertising", detail: ['(2010 – 2014)'] },
  ],
  skills: ['Art Direction', 'Graphic Design', 'Branding', 'Advertising'],
  programs: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe Indesign', 'Figma'],
  contact: {
    portfolio: 'mellen.do',
    email: 'melissaencarnacion21@gmail.com',
    phone: '+1 829.357.2112',
    location: 'Santo Domingo, D.R.',
    linkedin: 'www.linkedin.com/in/melissa-encarnación-108ab497',
  },
};

/** `tel:` href for a phone as the PDF writes it ("+1 829.357.2112" → "tel:+18293572112"). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
