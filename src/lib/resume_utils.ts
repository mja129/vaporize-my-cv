import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export type ExperienceEntry = {
  company: string;
  title: string;
  description: string;
};

export type Resume = {
  name: string;
  skills: string[];
  experience: ExperienceEntry[];
};


export async function extract_text(file: File): Promise<string> {
  const type = file.type;
  const name = file.name.toLowerCase();

  if (type === 'text/plain' || name.endsWith('.txt')) {
    return await file.text();
  }

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((item: any) => item.str + (item.hasEOL ? '\n' : ' ')).join(''));
    }
    return pages.join('\n');
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${file.name}`);
}

export async function parse_resume(text: string): Promise<string> {
  const response = await fetch('https://parse-my-cv.mja129.workers.dev', {
    method: 'POST',
    body: text,
  });
  if (!response.ok) throw new Error(`Worker error: ${response.status} ${await response.text()}`);
  return response.text();
}

export const debug_processed = `{
  "name": "Matthew Anderson",
  "skills": [
    "C",
    "Python",
    "JavaScript",
    "TypeScript",
    "Svelte",
    "React",
    "SQL",
    "Java",
    "HTML",
    "CSS"
  ],
  "experience": [
    {
      "title": "Undergraduate Teaching Assistant",
      "basic_description": "taught students and held office hours for computer systems classes",
      "description": "Teach recitations and hold office hours for cumulative ~300 students in Intro to Operating Systems (CS1550) and Computer Organization and Assembly Language (CS0447); ~90% recitation/~50% office hours attendance\\nVast proficiency in systems and computer organization through instruction, including modification of the Linux kernel, simulation and analysis of page tables and virtual memory, CPU simulation using circuit building software, reading and writing assembly, and more"
    },
    {
      "title": "Data Analyst and Integrations Engineer",
      "basic_description": "analyzed data and built stuff to collect information automatically",
      "description": "Operated on large amount of data from multiple sources using Knowi\\nCreated dashboards that provided crucial employee training insights and greatly increased onboarding efficiency and overall training completion\\nBuilt applications for Kubernetes cluster that automated data collection via API integration and webhooks"
    },
    {
      "title": "Full Stack Web Developer",
      "basic_description": "made a website thing with buttons and backend stuff that works",
      "description": "Co-engineered a full-stack circuit simulation platform from an existing codebase using TypeScript and Svelte, enabling real-time modeling of complex digital logic\\nDeveloped custom backend compilation engine to handle nested subcomponent circuits and wiring tunnels"
    }
  ]
}`

export const debug_resume = `Matthew Anderson
mja129.dev | mja129@pitt.edu | (845) 260-3538 | Pittsburgh, PA 15213
SUMMARY
Computational Biology and Computer Science senior at the University of Pittsburgh, with a certificate in Quantum
Computing. A systems-thinker who thrives at the intersection of logical rigor and creative expression, and enthusiast of
low-level architecture, high-level software design, and computational, biological, and quantum systems. Eager to
leverage a diverse background in data science, web development, and systems engineering to create elegant and multi-
disciplinary solutions to complex problems.
EDUCATION
University of Pittsburgh   Pittsburgh, PA
Bachelor of Science   Expected Graduation: April 2026
Majors: Computational Biology, Computer Science   GPA: 3.4
Certifications: Quantum Computing and Information
SKILLS
Technical Languages:   C, Python, {Java, Type}script, Svelte, React, SQL, Java, HTML, CSS, Go, R, C++, Embedded C
Tools & Infrastructure:   Unix, Git, Docker, AWS, Google Cloud, {Microsoft, Adobe, Apple} Suite, Vim
EXPERIENCE
University of Pittsburgh   Pittsburgh, PA
Undergraduate Teaching Assistant   January 2024-Present
•   Teach recitations and hold office hours for cumulative ~300 students in Intro to Operating Systems (CS1550)
and Computer Organization and Assembly Language (CS0447); ~90% recitation/~50% office hours attendance
•   Vast proficiency in systems and computer organization through instruction, including modification of the Linux
kernel, simulation and analysis of page tables and virtual memory, CPU simulation using circuit building
software, reading and writing assembly, and more
Quantum 5   Remote
Data Analyst and Integrations Engineer   June 2024-Present
•   Operated on large amount of data from multiple sources using Knowi
•   Created dashboards that provided crucial employee training insights and greatly increased onboarding efficiency
and overall training completion
•   Built applications for Kubernetes cluster that automated data collection via API integration and webhooks
Alpha Tau Omega, Kappa Psi Chapter   Pittsburgh, PA
Greek Sing Chair   January 2025-December 2025
•   Scheduled and led practices, organized events, and generally co-managed group of ~40 students
•   Choreographed/orchestrated ~70% of 10-minute dance number, edited audio and background visuals
Surreality Lab   Pittsburgh, PA
Frontend Web   March 2024-August 2024
•   Rebuilt the frontend of the Surreality Lab at Pitt's website
UPMC Hand Therapy Conference   Pittsburgh, PA
Full Stack Web   October 2025
•   Built the front end and file-hosting backend for a responsive web application that held educational handouts and
presentations for the 9 th   Annual Pittsburgh Hand Therapy Conference, on a 1-week rush order
LogicAp   Pittsburgh, PA
Full Stack Web
•   Co-engineered a full-stack circuit simulation platform from an existing codebase using TypeScript and Svelte,
enabling real-time modeling of complex digital logic
•   Developed custom backend compilation engine to handle nested subcomponent circuits and wiring tunnels`
