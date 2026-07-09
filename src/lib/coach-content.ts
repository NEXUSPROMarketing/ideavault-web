/**
 * The IdeaVault Business Coach diagnostic library — original content.
 * Twelve sticking points: the failure modes that actually stall founders,
 * matched to the vault's research vocabulary. Each carries the card copy,
 * the intake prompts shown to the user, and the focus brief the Coach
 * agent uses to aim its diagnosis.
 */

export type StickingPoint = {
  id: string;
  name: string;
  symptom: string;
  questions: [string, string];
  focus: string;
};

export const STICKING_POINTS: StickingPoint[] = [
  {
    id: "pre-launch-overthinking",
    name: "Stuck before the start",
    symptom: "Months of research, courses and notes — nothing shipped. The plan keeps getting better and the start date keeps moving.",
    questions: [
      "What have you actually produced in the last 30 days?",
      "What are you afraid happens the day you ship?",
    ],
    focus:
      "Diagnose research-as-procrastination. Force a scope collapse: the smallest sellable unit shipped inside 14 days, with one visible commitment device. Perfection is the constraint, not information.",
  },
  {
    id: "picking-by-excitement",
    name: "Chasing shiny, not fit",
    symptom: "A new favorite idea every week. None of them match your actual skills, hours or budget — and none survive contact with Monday.",
    questions: [
      "List the last three ideas you dropped — what killed each one?",
      "What do your skills, weekly hours and budget honestly look like?",
    ],
    focus:
      "The constraint is selection criteria, not idea supply. Rebuild the choice around founder fit (skills overlap, budget vs startup costs, hours vs difficulty, audience vs GTM). End with one idea and a written kill-criteria list for future shiny objects.",
  },
  {
    id: "dead-launch",
    name: "Launched to silence",
    symptom: "You shipped. You posted. Nothing happened — a handful of visits, zero signups or sales, and the graph has flatlined since.",
    questions: [
      "Where did the launch traffic actually come from, and how much was it?",
      "What exactly does your page promise in the first ten words?",
    ],
    focus:
      "Separate the three failure layers: no traffic, wrong traffic, or traffic that doesn't convert. Diagnose which one from the numbers, then prescribe the matching fix — channel, audience-problem match, or promise clarity. A launch is a channel test, not a verdict.",
  },
  {
    id: "no-distribution",
    name: "Built it, nobody's coming",
    symptom: "The product works and you're proud of it — but there is no channel, no list, no community, and 'post and pray' is the whole plan.",
    questions: [
      "Where do your target customers already gather and trade advice?",
      "How many conversations with real prospects have you had this month?",
    ],
    focus:
      "Distribution is a build project like the product was. Pick exactly one channel matched to where the customer already is, define a weekly rep count, and design the first ten genuinely useful contributions before any pitch.",
  },
  {
    id: "service-ceiling",
    name: "Trapped in client work",
    symptom: "The service business pays, but every dollar costs an hour. You're maxed out, and productizing keeps losing to this week's deliverables.",
    questions: [
      "Which client request do you get again and again, almost word for word?",
      "What would you sell if you could only sell something reusable?",
    ],
    focus:
      "Find the productizable core inside the repeated work: the audit, template, framework or tool clients keep buying in labor form. Prescribe a fixed weekly product block, a first productized offer with a price, and the discipline to sell it before building it fully.",
  },
  {
    id: "audience-no-product",
    name: "Audience without an offer",
    symptom: "People follow you, read you, reply to you — and you have nothing to sell them. Meanwhile others monetize smaller audiences than yours.",
    questions: [
      "What do people repeatedly ask you for help with?",
      "What's the last thing your audience paid anyone else to solve?",
    ],
    focus:
      "The audience is validated demand waiting for supply. Mine the asks for the first offer, bias to fast-to-ship formats (session, template, cohort, tool), price it honestly, and pre-sell to a shortlist before building.",
  },
  {
    id: "cant-charge",
    name: "Scared to charge",
    symptom: "Free users love it. Paid converts nobody — or you quoted a price so low it insults the work and still felt scary to say.",
    questions: [
      "What does your product save or earn for the buyer, in their numbers?",
      "What happened the last time you raised (or stated) a price?",
    ],
    focus:
      "Reframe price as value math: what the outcome is worth times the likelihood you deliver it, against the buyer's alternative cost. Prescribe one concrete pricing test with a floor, a deadline, and scripts for stating the price without flinching.",
  },
  {
    id: "feature-creep",
    name: "The MVP that won't stop growing",
    symptom: "Every week adds a feature and moves the launch. The 'minimum' in MVP left the building months ago.",
    questions: [
      "What's the one job a customer hires this product to do?",
      "Which current build items would a paying customer actually notice missing?",
    ],
    focus:
      "Enforce scope discipline: one feature, one channel, one customer type, one funnel. Cut the build list against the single job-to-be-done, park everything else in a v1.1 list, and set a ship date measured in days.",
  },
  {
    id: "first-customers",
    name: "Zero to first ten customers",
    symptom: "The product is ready and priced. Now you need ten paying strangers — and everything you try feels either spammy or invisible.",
    questions: [
      "Who got real value from anything you've shared so far?",
      "Which niche community would miss your posts if you stopped?",
    ],
    focus:
      "First customers come from warm proximity, not cold blast: named communities, direct genuinely-helpful outreach, and the founder's unfair access. Build a ten-name list with a specific first touch for each, favoring channels that don't require a sales personality.",
  },
  {
    id: "churn-leak",
    name: "Growth in, customers out",
    symptom: "Acquisition works — the bucket leaks. Cancellations track signups, and revenue is a treadmill that keeps speeding up.",
    questions: [
      "When do people cancel — day one, week two, month three?",
      "What does a successful customer do in their first week that churned ones don't?",
    ],
    focus:
      "Churn timing names the disease: onboarding gap, value gap, or audience mismatch. Find the activation moment retained customers share, then prescribe the shortest path to move every new customer to it inside week one.",
  },
  {
    id: "solo-stall",
    name: "Momentum gone",
    symptom: "Nothing is wrong exactly — but weeks pass, the streak is broken, and the project only moves when guilt spikes.",
    questions: [
      "What was the last task you finished, and when?",
      "Who notices if you ship nothing this week?",
    ],
    focus:
      "Solo momentum is a systems problem, not a willpower problem. Prescribe a weekly shipping cadence with external visibility (public log, accountability partner, community), shrink the unit of work until starting is trivial, and reconnect the project to the founder's stated goal.",
  },
  {
    id: "validate-or-build",
    name: "Validation limbo",
    symptom: "Some signal, some interest, a few nice comments — is that enough? You're stuck between more validation and committing to the build.",
    questions: [
      "What evidence would make you comfortable committing 90 days?",
      "What has anyone actually given up (money, time, email) for this so far?",
    ],
    focus:
      "Define the commitment bar: pre-orders, deposits, booked calls or signups from strangers — costly signals, not compliments. Design a two-week test that can hit the bar, and a written decision rule for what happens at pass or fail.",
  },
];

export const STICKING_POINT_IDS = STICKING_POINTS.map((p) => p.id) as [string, ...string[]];

export function getStickingPoint(id: string): StickingPoint | undefined {
  return STICKING_POINTS.find((p) => p.id === id);
}
