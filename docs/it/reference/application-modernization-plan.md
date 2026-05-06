---
read_when:
    - Pianificazione di un ampio intervento di modernizzazione dell'applicazione OpenClaw
    - Aggiornamento degli standard di implementazione del frontend per il lavoro sull'app o sulla Control UI
    - Trasformare un'ampia revisione della qualità del prodotto in lavoro di engineering suddiviso in fasi
summary: Piano completo di modernizzazione dell'applicazione con aggiornamenti delle Skills di delivery frontend
title: Piano di modernizzazione dell'applicazione
x-i18n:
    generated_at: "2026-05-06T09:07:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## Obiettivo

Portare l'applicazione verso un prodotto più pulito, più veloce e più manutenibile senza
interrompere i flussi di lavoro attuali o nascondere rischi in refactoring ampi. Il lavoro dovrebbe
essere integrato in porzioni piccole e revisionabili, con prove per ogni superficie toccata.

## Principi

- Conservare l'architettura attuale a meno che un confine non stia causando in modo dimostrabile churn,
  costi prestazionali o bug visibili agli utenti.
- Preferire la patch corretta più piccola per ogni problema, poi ripetere.
- Separare le correzioni necessarie dalla rifinitura opzionale, così i maintainer possono integrare lavoro ad
  alto valore senza aspettare decisioni soggettive.
- Mantenere il comportamento rivolto ai plugin documentato e retrocompatibile.
- Verificare il comportamento distribuito, i contratti delle dipendenze e i test prima di dichiarare che una
  regressione è stata risolta.
- Migliorare prima il percorso utente principale: onboarding, auth, chat, configurazione dei provider,
  gestione dei plugin e diagnostica.

## Fase 1: audit di baseline

Inventariare l'applicazione attuale prima di modificarla.

- Identificare i principali flussi di lavoro utente e le superfici di codice che li possiedono.
- Elencare affordance morte, impostazioni duplicate, stati di errore poco chiari e percorsi di
  rendering costosi.
- Acquisire i comandi di validazione attuali per ogni superficie.
- Contrassegnare i problemi come necessari, consigliati o opzionali.
- Documentare i blocchi noti che richiedono revisione del proprietario, in particolare modifiche ad API, sicurezza,
  release e contratti dei plugin.

Definizione di completato:

- Un elenco di problemi con riferimenti ai file dalla radice del repo.
- Ogni problema ha gravità, superficie proprietaria, impatto utente previsto e un percorso di
  validazione proposto.
- Nessun elemento di pulizia speculativo è mescolato alle correzioni necessarie.

## Fase 2: pulizia del prodotto e della UX

Dare priorità ai flussi di lavoro visibili e rimuovere la confusione.

- Rendere più chiari i testi di onboarding e gli stati vuoti relativi ad auth del modello, stato del gateway
  e configurazione dei plugin.
- Rimuovere o disabilitare le affordance morte dove non è possibile alcuna azione.
- Mantenere le azioni importanti visibili alle varie larghezze responsive invece di nasconderle
  dietro assunzioni fragili di layout.
- Consolidare il linguaggio di stato ripetuto, così gli errori hanno un'unica fonte di verità.
- Aggiungere disclosure progressiva per le impostazioni avanzate mantenendo veloce la configurazione principale.

Validazione consigliata:

- Percorso manuale riuscito per la configurazione al primo avvio e l'avvio di utenti esistenti.
- Test mirati per qualsiasi logica di routing, persistenza della configurazione o derivazione dello stato.
- Screenshot del browser per le superfici responsive modificate.

## Fase 3: rafforzamento dell'architettura frontend

Migliorare la manutenibilità senza una riscrittura ampia.

- Spostare le trasformazioni ripetute dello stato UI in helper tipizzati ristretti.
- Tenere separate le responsabilità di recupero dati, persistenza e presentazione.
- Preferire hook, store e pattern di componenti esistenti rispetto a nuove astrazioni.
- Dividere componenti sovradimensionati solo quando riduce l'accoppiamento o chiarisce i test.
- Evitare di introdurre uno stato globale ampio per interazioni locali dei pannelli.

Guardrail necessari:

- Non modificare il comportamento pubblico come effetto collaterale della divisione dei file.
- Mantenere intatto il comportamento di accessibilità per menu, finestre di dialogo, schede e navigazione
  da tastiera.
- Verificare che gli stati di caricamento, vuoti, di errore e ottimistici vengano ancora renderizzati.

## Fase 4: prestazioni e affidabilità

Mirare a problemi misurati invece che a ottimizzazioni teoriche ampie.

- Misurare i costi di avvio, transizione tra route, liste grandi e trascrizione chat.
- Sostituire dati derivati costosi e ripetuti con selettori memoizzati o helper in cache
  dove il profiling dimostra valore.
- Ridurre scansioni evitabili di rete o filesystem nei percorsi caldi.
- Mantenere un ordinamento deterministico per input di prompt, registry, file, plugin e rete
  prima della costruzione del payload del modello.
- Aggiungere test di regressione leggeri per helper caldi e confini contrattuali.

Definizione di completato:

- Ogni modifica prestazionale registra baseline, impatto atteso, impatto effettivo e
  divario residuo.
- Nessuna patch prestazionale viene integrata solo in base all'intuizione quando è disponibile una misurazione economica.

## Fase 5: rafforzamento di tipi, contratti e test

Aumentare la correttezza nei punti di confine da cui dipendono utenti e autori di plugin.

- Sostituire stringhe runtime lasche con union discriminate o liste chiuse di codici.
- Validare input esterni con helper di schema esistenti o zod.
- Aggiungere test di contratto attorno a manifest dei plugin, cataloghi provider, messaggi del protocollo gateway
  e comportamento di migrazione della configurazione.
- Mantenere i percorsi di compatibilità in flussi doctor o di riparazione invece che in migrazioni nascoste
  al momento dell'avvio.
- Evitare accoppiamento solo nei test agli internals dei plugin; usare facade SDK e barrel
  documentati.

Validazione consigliata:

- `pnpm check:changed`
- Test mirati per ogni confine modificato.
- `pnpm build` quando cambiano confini lazy, packaging o superfici pubblicate.

## Fase 6: documentazione e preparazione alla release

Mantenere la documentazione rivolta agli utenti allineata al comportamento.

- Aggiornare la documentazione con modifiche a comportamento, API, configurazione, onboarding o plugin.
- Aggiungere voci di changelog solo per modifiche visibili agli utenti.
- Mantenere la terminologia dei plugin rivolta agli utenti; usare nomi di pacchetti interni solo dove
  necessario per i contributor.
- Confermare che le istruzioni di release e installazione corrispondano ancora alla superficie dei comandi
  attuale.

Definizione di completato:

- La documentazione rilevante è aggiornata nello stesso branch delle modifiche comportamentali.
- I controlli su documentazione generata o drift API passano quando toccati.
- L'handoff indica qualsiasi validazione saltata e perché è stata saltata.

## Prima porzione consigliata

Iniziare con un passaggio circoscritto su Control UI e onboarding:

- Esaminare configurazione al primo avvio, readiness dell'auth dei provider, stato gateway e superfici di
  configurazione dei plugin.
- Rimuovere azioni morte e chiarire gli stati di errore.
- Aggiungere o aggiornare test mirati per derivazione dello stato e persistenza della configurazione.
- Eseguire `pnpm check:changed`.

Questo offre alto valore utente con rischio architetturale limitato.

## Aggiornamento della skill frontend

Usare questa sezione per aggiornare il `SKILL.md` focalizzato sul frontend fornito con il
task di modernizzazione. Se si adotta questa guida come skill OpenClaw locale del repo,
creare prima `.agents/skills/openclaw-frontend/SKILL.md`, mantenere il frontmatter
che appartiene a quella skill di destinazione, quindi aggiungere o sostituire la guida del body con
il contenuto seguente.

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
