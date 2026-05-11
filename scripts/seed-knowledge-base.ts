import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const hf = new HfInference(process.env.HF_API_TOKEN);

const knowledgeChunks = [
  {
    area: 'constitutional',
    sub_area: 'fundamental_rights',
    question: 'What are the fundamental rights guaranteed by the Constitution of Bangladesh?',
    answer: 'The Constitution of Bangladesh (1972) guarantees fundamental rights in Part II (Articles 26-47A). These include: (1) Equality before law (Art. 27), (2) Discrimination prohibition (Art. 28), (3) Equality of opportunity (Art. 29), (4) Protection of life and personal liberty (Art. 32), (5) Safeguards against arrest and detention (Art. 33), (6) Freedom of movement (Art. 36), (7) Freedom of assembly (Art. 37), (8) Freedom of association (Art. 38), (9) Freedom of thought and conscience (Art. 39), (10) Freedom of profession (Art. 40), (11) Protection of property (Art. 42), (12) Protection of home and correspondence (Art. 43), (13) Freedom of religion (Art. 41).',
    legal_basis: "Constitution of the People's Republic of Bangladesh, 1972, Part II, Articles 26-47A",
    procedure: 'If fundamental rights are violated, you may file a writ petition under Article 102 of the Constitution before the High Court Division.',
    conclusion: 'Fundamental rights are enforceable through the High Court Division under Article 102. For urgent violations, consult a qualified advocate immediately.',
    act_name: "Constitution of the People's Republic of Bangladesh",
    section_numbers: ['26', '27', '28', '29', '32', '33', '36', '37', '38', '39', '40', '41', '42', '43', '102'],
    year_enacted: 1972,
    last_verified: '2025-03-09',
    verified_by: 'Nazmul Islam, Advocate, Supreme Court of Bangladesh',
    trigger_keywords: ['fundamental rights', 'constitutional rights', 'basic rights', 'citizen rights', 'human rights bangladesh']
  },
  {
    area: 'criminal',
    sub_area: 'arrest_rights',
    question: 'What are my rights if I am arrested in Bangladesh?',
    answer: 'Under the Constitution and the Code of Criminal Procedure 1898, an arrested person has the following rights: (1) Right to be informed of grounds of arrest (Art. 33, CrPC S. 60), (2) Right to consult and be defended by a lawyer (Art. 33), (3) Right to be produced before a magistrate within 24 hours (Art. 33, CrPC S. 61), (4) Right against torture and cruel treatment (Art. 35), (5) Right to remain silent, (6) Right to medical examination if alleging torture (CrPC S. 54).',
    legal_basis: 'Constitution Art. 33, 35; Code of Criminal Procedure 1898, Sections 54, 60, 61',
    procedure: 'If arrested: (1) Ask for grounds of arrest in writing, (2) Demand legal representation immediately, (3) Do not sign any statement without lawyer present, (4) Request family notification, (5) If not produced before magistrate within 24 hours, the detention is illegal.',
    conclusion: 'Arrest rights are constitutionally protected. Any violation may give rise to a writ petition for illegal detention under Article 102.',
    act_name: 'Code of Criminal Procedure, 1898',
    section_numbers: ['54', '60', '61'],
    year_enacted: 1898,
    last_verified: '2025-03-09',
    verified_by: 'Nazmul Islam, Advocate, Supreme Court of Bangladesh',
    trigger_keywords: ['arrest', 'arrested', 'police custody', 'detention', 'remand', 'rights when arrested']
  },
  {
    area: 'family',
    sub_area: 'divorce',
    religion: 'muslim',
    question: 'What is the procedure for talaq under Muslim law in Bangladesh?',
    answer: 'Under the Muslim Family Laws Ordinance 1961: (1) Talaq must be pronounced with clear intention, (2) Notice must be given to the Chairman of the Union Parishad within 30 days, (3) The Chairman forms an Arbitration Council within 30 days, (4) The Council attempts reconciliation for 90 days, (5) If reconciliation fails, talaq becomes effective after 90 days, (6) The wife is entitled to maintenance during the iddat period.',
    legal_basis: 'Muslim Family Laws Ordinance, 1961, Sections 7, 7A',
    procedure: 'Steps: (1) Pronounce talaq with witnesses, (2) File written notice with Union Parishad Chairman within 30 days, (3) Attend Arbitration Council meetings, (4) If reconciliation fails, obtain certificate of effectiveness, (5) Register divorce with Nikah Registrar.',
    conclusion: 'Talaq without following the Ordinance procedure is legally irregular but not void. The wife may claim maintenance and dower.',
    act_name: 'Muslim Family Laws Ordinance',
    section_numbers: ['7', '7A'],
    year_enacted: 1961,
    last_verified: '2025-03-09',
    verified_by: 'Nazmul Islam, Advocate, Supreme Court of Bangladesh',
    trigger_keywords: ['talaq', 'divorce', 'muslim divorce', 'islamic divorce', 'triple talaq', 'khula']
  },
  {
    area: 'family',
    sub_area: 'divorce',
    religion: 'hindu',
    question: 'What is the divorce procedure for Hindus in Bangladesh?',
    answer: "Hindu personal law in Bangladesh does not traditionally recognize divorce. However, the Hindu Married Women's Right to Separate Residence and Maintenance Act 1946 allows a Hindu married woman to claim separate residence and maintenance on specific grounds (desertion, cruelty, leprosy, etc.). The Special Marriage Act 1872 provides a civil marriage and divorce framework for inter-faith marriages.",
    legal_basis: "Hindu Married Women's Right to Separate Residence and Maintenance Act, 1946; Special Marriage Act, 1872",
    procedure: 'For Hindu women seeking separation: (1) File suit in Family Court for separate residence and maintenance, (2) Prove grounds under the 1946 Act, (3) Court may grant decree with maintenance.',
    conclusion: 'Hindu personal law in Bangladesh is restrictive regarding divorce. Women should consult a family law advocate for available remedies.',
    act_name: "Hindu Married Women's Right to Separate Residence and Maintenance Act",
    section_numbers: ['2', '3'],
    year_enacted: 1946,
    last_verified: '2025-03-09',
    verified_by: 'Nazmul Islam, Advocate, Supreme Court of Bangladesh',
    trigger_keywords: ['hindu divorce', 'hindu marriage', 'separate residence', 'maintenance hindu']
  },
  {
    area: 'company',
    sub_area: 'registration',
    question: 'What are the requirements for private limited company registration in Bangladesh?',
    answer: 'Under the Companies Act 1994: (1) Minimum 2 shareholders, maximum 50, (2) Minimum 2 directors (natural persons, at least 18 years old), (3) Minimum paid-up capital BDT 1 (practical minimum BDT 1 lakh for RJSC), (4) Registered office address in Bangladesh, (5) Company name approval from RJSC, (6) Memorandum and Articles of Association, (7) Digital signature of directors.',
    legal_basis: 'Companies Act, 1994, Sections 5, 6, 7, 8, 9',
    procedure: 'Steps: (1) Name clearance from RJSC (online), (2) Prepare MOA and AOA, (3) Open temporary bank account for capital, (4) File Form XII with RJSC, (5) Pay registration fees, (6) Obtain Certificate of Incorporation, (7) Register for TIN, (8) Obtain trade license.',
    conclusion: 'Company registration typically takes 15-30 working days. Professional assistance is recommended.',
    act_name: 'Companies Act',
    section_numbers: ['5', '6', '7', '8', '9', '12'],
    year_enacted: 1994,
    last_verified: '2025-03-09',
    verified_by: 'Nazmul Islam, Advocate, Supreme Court of Bangladesh',
    trigger_keywords: ['company registration', 'private limited company', 'RJSC', 'incorporation', 'business registration']
  },
  {
    area: 'property',
    sub_area: 'land_mutation',
    question: 'What is the procedure for land mutation (namjari) in Bangladesh?',
    answer: 'Land mutation (namjari) updates land records when ownership changes. Under the State Acquisition and Tenancy Act 1950: (1) Apply to the Assistant Commissioner (Land), (2) Submit deed of transfer, (3) Pay mutation fees (1-2% of land value), (4) AC Land conducts field inquiry, (5) Notice is published for objections, (6) If no objections, mutation order is issued, (7) Khatian and dag number are updated.',
    legal_basis: 'State Acquisition and Tenancy Act, 1950; Land Reform Ordinance, 1984',
    procedure: 'Steps: (1) Obtain certified copy of deed from Sub-Registry Office, (2) Apply to AC Land, (3) Pay prescribed fees, (4) Attend field inquiry, (5) Respond to objections within 15 days, (6) Obtain mutation order, (7) Update Khatian at Land Office.',
    conclusion: 'Mutation is essential for legal ownership recognition. Without mutation, the new owner cannot exercise full ownership rights.',
    act_name: 'State Acquisition and Tenancy Act',
    section_numbers: ['xx'],
    year_enacted: 1950,
    last_verified: '2025-03-09',
    verified_by: 'Nazmul Islam, Advocate, Supreme Court of Bangladesh',
    trigger_keywords: ['mutation', 'namjari', 'land transfer', 'property transfer', 'khatian', 'land record']
  }
];

async function seed() {
  console.log('Seeding knowledge base...');
  for (const chunk of knowledgeChunks) {
    const { error } = await supabase.from('knowledge_chunks').insert(chunk);
    if (error) {
      console.error('Error inserting chunk:', error);
    } else {
      console.log(`Inserted: ${chunk.area} - ${chunk.question.substring(0, 50)}...`);
    }
  }
  console.log('Seed complete! Now generating embeddings...');

  const { data: chunks } = await supabase.from('knowledge_chunks').select('*').is('embedding', null);
  for (const chunk of chunks || []) {
    const text = `${chunk.question}\n${chunk.answer}\n${chunk.legal_basis}\n${chunk.act_name || ''}`;
    try {
      const embedding = await hf.featureExtraction({ model: 'sentence-transformers/all-MiniLM-L6-v2', inputs: text });
      await supabase.from('knowledge_chunks').update({ embedding }).eq('id', chunk.id);
      console.log(`Embedded: ${chunk.area} - ${chunk.question.substring(0, 40)}...`);
    } catch (err) {
      console.error(`Error embedding ${chunk.id}:`, err);
    }
  }
  console.log('All done!');
}

seed();