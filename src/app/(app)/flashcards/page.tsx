import { Layers } from "lucide-react";
import { Flashcards } from "@/components/Flashcards";
import { PageHeader } from "@/components/ui";
import { FLASHCARDS } from "@/lib/questions/gk";
import { IDIOM_LIST, OWS_LIST, VOCAB_LIST } from "@/lib/questions/english";

export const metadata = { title: "Flashcards" };

export default function FlashcardsPage() {
  const decks = [
    ...FLASHCARDS,
    { deck: "Vocabulary (synonym)", items: VOCAB_LIST.map(([w, s]) => [w, s] as [string, string]) },
    { deck: "Vocabulary (antonym)", items: VOCAB_LIST.map(([w, , a]) => [w, a] as [string, string]) },
    { deck: "Idioms & Phrases", items: IDIOM_LIST },
    { deck: "One-word substitution", items: OWS_LIST },
  ];
  return (
    <div>
      <PageHeader icon={<Layers />} title="Flashcards" subtitle="Quick revision for static GK, banking awareness and vocabulary. Tap a card to flip it." />
      <Flashcards decks={decks} />
    </div>
  );
}
