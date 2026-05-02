---
x-i18n:
    generated_at: "2026-05-02T22:22:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Progettazione dell'importazione di temi personalizzati tweakcn

Stato: approvato nel terminale il 2026-04-22

## Riepilogo

Aggiungere esattamente uno slot di tema personalizzato della UI di controllo, locale al browser, importabile da un link di condivisione tweakcn. Le famiglie di temi integrate esistenti restano `claw`, `knot` e `dash`. La nuova famiglia `custom` si comporta come una normale famiglia di temi OpenClaw e supporta le modalità `light`, `dark` e `system` quando il payload tweakcn importato include sia il set di token chiaro sia quello scuro.

Il tema importato viene archiviato solo nel profilo del browser corrente insieme al resto delle impostazioni della UI di controllo. Non viene scritto nella configurazione del Gateway e non viene sincronizzato tra dispositivi o browser.

## Problema

Il sistema di temi della UI di controllo è attualmente chiuso su tre famiglie di temi codificate rigidamente:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Gli utenti possono passare tra famiglie integrate e varianti di modalità, ma non possono importare un tema da tweakcn senza modificare il CSS del repo. Il risultato richiesto è più limitato di un sistema generale di tematizzazione: mantenere i tre temi integrati e aggiungere uno slot importato controllato dall'utente, sostituibile da un link tweakcn.

## Obiettivi

- Mantenere invariate le famiglie di temi integrate esistenti.
- Aggiungere esattamente uno slot personalizzato importato, non una libreria di temi.
- Accettare un link di condivisione tweakcn o un URL diretto `https://tweakcn.com/r/themes/{id}`.
- Rendere persistente il tema importato solo nello storage locale del browser.
- Far funzionare lo slot importato con i controlli di modalità `light`, `dark` e `system` esistenti.
- Mantenere sicuro il comportamento in caso di errore: un'importazione non valida non deve mai rompere il tema attivo della UI.

## Non obiettivi

- Nessuna libreria multi-tema o lista locale al browser di importazioni.
- Nessuna persistenza lato Gateway o sincronizzazione tra dispositivi.
- Nessun editor CSS arbitrario o editor JSON grezzo del tema.
- Nessun caricamento automatico di asset di font remoti da tweakcn.
- Nessun tentativo di supportare payload tweakcn che espongono una sola modalità.
- Nessun refactor della tematizzazione a livello di repo oltre alle interfacce richieste per la UI di controllo.

## Decisioni utente già prese

- Mantenere i tre temi integrati.
- Aggiungere uno slot di importazione alimentato da tweakcn.
- Archiviare il tema importato nel browser, non nella configurazione del Gateway.
- Supportare `light`, `dark` e `system` per lo slot importato.
- Sovrascrivere lo slot personalizzato con l'importazione successiva è il comportamento previsto.

## Approccio consigliato

Aggiungere un quarto id di famiglia di temi, `custom`, al modello dei temi della UI di controllo. La famiglia `custom` diventa selezionabile solo quando è presente un'importazione tweakcn valida. Il payload importato viene normalizzato in un record di tema personalizzato specifico di OpenClaw e archiviato nello storage locale del browser insieme al resto delle impostazioni della UI.

A runtime, OpenClaw renderizza un tag `<style>` gestito che definisce i blocchi di variabili CSS personalizzate risolti:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Questo mantiene le variabili del tema personalizzato limitate alla famiglia `custom` ed evita di far trapelare variabili CSS inline nelle famiglie integrate.

## Architettura

### Modello del tema

Aggiornare `ui/src/ui/theme.ts`:

- Estendere `ThemeName` per includere `custom`.
- Estendere `ResolvedTheme` per includere `custom` e `custom-light`.
- Estendere `VALID_THEME_NAMES`.
- Aggiornare `resolveTheme()` in modo che `custom` rispecchi il comportamento delle famiglie esistenti:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` o `custom-light` in base alla preferenza del sistema operativo

Non vengono aggiunti alias legacy per `custom`.

### Modello di persistenza

Estendere la persistenza di `UiSettings` in `ui/src/ui/storage.ts` con un payload opzionale per il tema personalizzato:

- `customTheme?: ImportedCustomTheme`

Forma archiviata consigliata:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Note:

- `sourceUrl` archivia l'input originale dell'utente dopo la normalizzazione.
- `themeId` è l'id del tema tweakcn estratto dall'URL.
- `label` è il campo `name` di tweakcn quando presente, altrimenti `Custom`.
- `light` e `dark` sono mappe di token OpenClaw già normalizzate, non payload tweakcn grezzi.
- Il payload importato vive accanto alle altre impostazioni locali al browser ed è serializzato nello stesso documento di local storage.
- Se i dati archiviati del tema personalizzato mancano o non sono validi al caricamento, ignorare il payload e tornare a `theme: "claw"` quando la famiglia persistita era `custom`.

### Applicazione runtime

Aggiungere un gestore ristretto del foglio di stile del tema personalizzato nel runtime della UI di controllo, vicino a `ui/src/ui/app-settings.ts` e `ui/src/ui/theme.ts`.

Responsabilità:

- Creare o aggiornare un tag `<style id="openclaw-custom-theme">` stabile in `document.head`.
- Emettere CSS solo quando esiste un payload di tema personalizzato valido.
- Rimuovere il contenuto del tag style quando il payload viene cancellato.
- Mantenere il CSS delle famiglie integrate in `ui/src/styles/base.css`; non innestare token importati nel foglio di stile versionato nel repo.

Questo gestore viene eseguito ogni volta che le impostazioni vengono caricate, salvate, importate o cancellate.

### Selettori della modalità chiara

L'implementazione dovrebbe preferire `data-theme-mode="light"` per gli stili chiari trasversali alle famiglie, invece di trattare `custom-light` come caso speciale. Se un selettore esistente è vincolato a `data-theme="light"` e deve applicarsi a ogni famiglia chiara, ampliarlo come parte di questo lavoro.

## UX di importazione

Aggiornare `ui/src/ui/views/config.ts` nella sezione `Aspetto`:

- Aggiungere una scheda tema `Personalizzato` accanto a `Claw`, `Knot` e `Dash`.
- Mostrare la scheda come disabilitata quando non esiste alcun tema personalizzato importato.
- Aggiungere un pannello di importazione sotto la griglia dei temi con:
  - un input di testo per un link di condivisione tweakcn o un URL `/r/themes/{id}`
  - un pulsante `Importa`
  - un percorso `Sostituisci` quando esiste già un payload personalizzato
  - un'azione `Cancella` quando esiste già un payload personalizzato
- Mostrare l'etichetta del tema importato e l'host sorgente quando esiste un payload.
- Se il tema attivo è `custom`, l'importazione di una sostituzione viene applicata immediatamente.
- Se il tema attivo non è `custom`, l'importazione archivia solo il nuovo payload finché l'utente non seleziona la scheda `Personalizzato`.

Anche il selettore rapido del tema in `ui/src/ui/views/config-quick.ts` dovrebbe mostrare `Personalizzato` solo quando esiste un payload.

## Analisi dell'URL e fetch remoto

Il percorso di importazione nel browser accetta:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

L'implementazione dovrebbe normalizzare entrambe le forme in:

- `https://tweakcn.com/r/themes/{id}`

Il browser quindi effettua direttamente il fetch dell'endpoint `/r/themes/{id}` normalizzato.

Usare un validatore di schema ristretto per il payload esterno. Uno schema zod è preferito perché questo è un confine esterno non attendibile.

Campi remoti richiesti:

- `name` di primo livello come stringa opzionale
- `cssVars.theme` come oggetto opzionale
- `cssVars.light` come oggetto
- `cssVars.dark` come oggetto

Se manca `cssVars.light` o `cssVars.dark`, rifiutare l'importazione. Questo è intenzionale: il comportamento di prodotto approvato è il supporto completo delle modalità, non una sintesi best-effort del lato mancante.

## Mappatura dei token

Non replicare alla cieca le variabili tweakcn. Normalizzare un sottoinsieme limitato in token OpenClaw e derivare il resto in un helper.

### Token importati direttamente

Da ciascun blocco modalità tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Da `cssVars.theme` condiviso quando presente:

- `font-sans`
- `font-mono`

Se un blocco modalità sovrascrive `font-sans`, `font-mono` o `radius`, vince il valore locale alla modalità.

### Token derivati per OpenClaw

L'importatore deriva variabili solo OpenClaw dai colori di base importati:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Le regole di derivazione vivono in un helper puro, così possono essere testate in modo indipendente. Le formule esatte di miscelazione dei colori sono un dettaglio implementativo, ma l'helper deve soddisfare due vincoli:

- preservare un contrasto leggibile vicino all'intento del tema importato
- produrre output stabile per lo stesso payload importato

### Token ignorati nella v1

Questi token tweakcn vengono intenzionalmente ignorati nella prima versione:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Questo mantiene l'ambito sui token di cui l'attuale UI di controllo ha effettivamente bisogno.

### Font

Le stringhe dello stack di font vengono importate se presenti, ma OpenClaw non carica asset di font remoti nella v1. Se lo stack importato fa riferimento a font non disponibili nel browser, si applica il normale comportamento di fallback.

## Comportamento in caso di errore

Le importazioni non valide devono fallire in modo chiuso.

- Formato URL non valido: mostrare un errore di validazione inline, non effettuare il fetch.
- Host o forma del percorso non supportati: mostrare un errore di validazione inline, non effettuare il fetch.
- Errore di rete, risposta non OK o JSON malformato: mostrare un errore inline, mantenere intatto il payload attualmente archiviato.
- Errore di schema o blocchi light/dark mancanti: mostrare un errore inline, mantenere intatto il payload attualmente archiviato.
- Azione di cancellazione:
  - rimuove il payload personalizzato archiviato
  - rimuove il contenuto del tag style personalizzato gestito
  - se `custom` è attivo, riporta la famiglia di temi a `claw`
- Payload personalizzato archiviato non valido al primo caricamento:
  - ignorare il payload archiviato
  - non emettere CSS personalizzato
  - se la famiglia di temi persistita era `custom`, tornare a `claw`

In nessun momento un'importazione non riuscita dovrebbe lasciare il documento attivo con variabili CSS personalizzate parziali applicate.

## File che dovrebbero cambiare nell'implementazione

File principali:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Helper probabilmente nuovi:

- `ui/src/ui/custom-theme.ts`

Test:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- nuovi test mirati per l'analisi degli URL e la normalizzazione dei payload

## Test

Copertura minima dell'implementazione:

- analizzare l'URL del link di condivisione nell'id del tema tweakcn
- normalizzare `/themes/{id}` e `/r/themes/{id}` nell'URL di fetch
- rifiutare host non supportati e id malformati
- validare la forma del payload tweakcn
- mappare un payload tweakcn valido in mappe di token OpenClaw chiara e scura normalizzate
- caricare e salvare il payload personalizzato nelle impostazioni locali al browser
- risolvere `custom` per `light`, `dark` e `system`
- disabilitare la selezione di `Personalizzato` quando non esiste alcun payload
- applicare immediatamente il tema importato quando `custom` è già attivo
- tornare a `claw` quando il tema personalizzato attivo viene cancellato

Obiettivo di verifica manuale:

- importare un tema tweakcn noto dalle Impostazioni
- passare tra `light`, `dark` e `system`
- passare tra `custom` e le famiglie integrate
- ricaricare la pagina e confermare che il tema personalizzato importato persiste localmente

## Note di rollout

Questa funzionalità è intenzionalmente piccola. Se in seguito gli utenti chiedono più temi importati, rinomina, esportazione o sincronizzazione tra dispositivi, trattarlo come una progettazione successiva. Non pre-costruire un'astrazione di libreria di temi in questa implementazione.
