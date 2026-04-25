---
x-i18n:
    generated_at: "2026-04-25T13:56:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Design für den Import benutzerdefinierter Themes von Tweakcn

Status: im Terminal am 2026-04-22 genehmigt

## Zusammenfassung

Fügen Sie genau einen browserlokalen benutzerdefinierten Theme-Slot für die Control UI hinzu, der über einen tweakcn-Freigabelink importiert werden kann. Die bestehenden integrierten Theme-Familien bleiben `claw`, `knot` und `dash`. Die neue Familie `custom` verhält sich wie eine normale OpenClaw-Theme-Familie und unterstützt `light`, `dark` und `system`, wenn die importierte tweakcn-Nutzlast sowohl helle als auch dunkle Token-Sets enthält.

Das importierte Theme wird nur im aktuellen Browserprofil zusammen mit den übrigen Einstellungen der Control UI gespeichert. Es wird nicht in die Gateway-Konfiguration geschrieben und synchronisiert sich nicht über Geräte oder Browser hinweg.

## Problem

Das Theme-System der Control UI ist derzeit auf drei hart codierte Theme-Familien beschränkt:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Benutzer können zwischen integrierten Familien und Modusvarianten wechseln, aber sie können kein Theme aus tweakcn einbringen, ohne CSS im Repo zu bearbeiten. Das gewünschte Ergebnis ist kleiner als ein allgemeines Theming-System: Behalten Sie die drei integrierten Themes bei und fügen Sie einen vom Benutzer kontrollierten importierten Slot hinzu, der über einen tweakcn-Link ersetzt werden kann.

## Ziele

- Die bestehenden integrierten Theme-Familien unverändert lassen.
- Genau einen importierten benutzerdefinierten Slot hinzufügen, keine Theme-Bibliothek.
- Einen tweakcn-Freigabelink oder eine direkte URL `https://tweakcn.com/r/themes/{id}` akzeptieren.
- Das importierte Theme nur im lokalen Speicher des Browsers persistieren.
- Den importierten Slot mit den bestehenden Steuerelementen für `light`, `dark` und `system` funktionieren lassen.
- Fehlerverhalten sicher halten: Ein fehlerhafter Import darf das aktive UI-Theme niemals beschädigen.

## Keine Ziele

- Keine Bibliothek mit mehreren Themes oder browserlokale Liste von Imports.
- Keine gatewayseitige Persistenz oder geräteübergreifende Synchronisierung.
- Kein beliebiger CSS-Editor oder Roh-Editor für Theme-JSON.
- Kein automatisches Laden entfernter Schrift-Assets von tweakcn.
- Kein Versuch, tweakcn-Nutzlasten zu unterstützen, die nur einen Modus bereitstellen.
- Kein repo-weites Theming-Refactoring über die für die Control UI erforderlichen Schnittstellen hinaus.

## Bereits getroffene Benutzerentscheidungen

- Die drei integrierten Themes beibehalten.
- Einen importgestützten Slot auf Basis von tweakcn hinzufügen.
- Das importierte Theme im Browser speichern, nicht in der Gateway-Konfiguration.
- `light`, `dark` und `system` für das importierte Theme unterstützen.
- Das Überschreiben des benutzerdefinierten Slots durch den nächsten Import ist das beabsichtigte Verhalten.

## Empfohlener Ansatz

Fügen Sie dem Theme-Modell der Control UI eine vierte Theme-Familien-ID `custom` hinzu. Die Familie `custom` wird erst auswählbar, wenn ein gültiger tweakcn-Import vorhanden ist. Die importierte Nutzlast wird in einen OpenClaw-spezifischen Datensatz für benutzerdefinierte Themes normalisiert und zusammen mit den übrigen UI-Einstellungen im lokalen Speicher des Browsers gespeichert.

Zur Laufzeit rendert OpenClaw ein verwaltetes `<style>`-Tag, das die aufgelösten benutzerdefinierten CSS-Variablenblöcke definiert:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Dadurch bleiben benutzerdefinierte Theme-Variablen auf die Familie `custom` beschränkt und es wird vermieden, dass Inline-CSS-Variablen in die integrierten Familien auslaufen.

## Architektur

### Theme-Modell

Aktualisieren Sie `ui/src/ui/theme.ts`:

- `ThemeName` um `custom` erweitern.
- `ResolvedTheme` um `custom` und `custom-light` erweitern.
- `VALID_THEME_NAMES` erweitern.
- `resolveTheme()` aktualisieren, sodass sich `custom` wie die bestehende Familienlogik verhält:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` oder `custom-light` abhängig von der OS-Präferenz

Für `custom` werden keine Legacy-Aliasse hinzugefügt.

### Persistenzmodell

Erweitern Sie die Persistenz von `UiSettings` in `ui/src/ui/storage.ts` um eine optionale Nutzlast für benutzerdefinierte Themes:

- `customTheme?: ImportedCustomTheme`

Empfohlene gespeicherte Form:

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

Hinweise:

- `sourceUrl` speichert die ursprüngliche Benutzereingabe nach der Normalisierung.
- `themeId` ist die aus der URL extrahierte tweakcn-Theme-ID.
- `label` ist das tweakcn-Feld `name`, wenn vorhanden, sonst `Custom`.
- `light` und `dark` sind bereits normalisierte OpenClaw-Token-Maps, keine rohen tweakcn-Nutzlasten.
- Die importierte Nutzlast liegt neben anderen browserlokalen Einstellungen und wird im selben Dokument des lokalen Speichers serialisiert.
- Wenn gespeicherte Daten für benutzerdefinierte Themes beim Laden fehlen oder ungültig sind, ignorieren Sie die Nutzlast und fallen Sie auf `theme: "claw"` zurück, wenn die persistierte Familie `custom` war.

### Anwendung zur Laufzeit

Fügen Sie einen schmalen Stylesheet-Manager für benutzerdefinierte Themes in der Runtime der Control UI hinzu, in der Nähe von `ui/src/ui/app-settings.ts` und `ui/src/ui/theme.ts`.

Verantwortlichkeiten:

- Ein stabiles `<style id="openclaw-custom-theme">`-Tag in `document.head` erstellen oder aktualisieren.
- CSS nur ausgeben, wenn eine gültige Nutzlast für benutzerdefinierte Themes existiert.
- Den Inhalt des Style-Tags entfernen, wenn die Nutzlast gelöscht wird.
- Die integrierte CSS-Familie in `ui/src/styles/base.css` belassen; importierte Token nicht in das eingecheckte Stylesheet einfügen.

Dieser Manager läuft immer dann, wenn Einstellungen geladen, gespeichert, importiert oder gelöscht werden.

### Selektoren für den Hellmodus

Die Implementierung sollte `data-theme-mode="light"` für familienübergreifendes Styling im Hellmodus bevorzugen, statt `custom-light` speziell zu behandeln. Wenn ein bestehender Selektor an `data-theme="light"` gebunden ist und für jede helle Familie gelten soll, erweitern Sie ihn im Rahmen dieser Arbeit.

## Import-UX

Aktualisieren Sie `ui/src/ui/views/config.ts` im Abschnitt `Appearance`:

- Eine Theme-Karte `Custom` neben `Claw`, `Knot` und `Dash` hinzufügen.
- Die Karte als deaktiviert anzeigen, wenn kein importiertes benutzerdefiniertes Theme existiert.
- Unter dem Theme-Raster ein Import-Panel hinzufügen mit:
  - einem Texteingabefeld für einen tweakcn-Freigabelink oder eine URL `/r/themes/{id}`
  - einer Schaltfläche `Import`
  - einem Pfad `Replace`, wenn bereits eine benutzerdefinierte Nutzlast existiert
  - einer Aktion `Clear`, wenn bereits eine benutzerdefinierte Nutzlast existiert
- Das Label des importierten Themes und den Quell-Host anzeigen, wenn eine Nutzlast existiert.
- Wenn das aktive Theme `custom` ist, wird ein importierter Ersatz sofort angewendet.
- Wenn das aktive Theme nicht `custom` ist, speichert der Import nur die neue Nutzlast, bis der Benutzer die Karte `Custom` auswählt.

Die schnelle Theme-Auswahl in `ui/src/ui/views/config-quick.ts` sollte `Custom` ebenfalls nur anzeigen, wenn eine Nutzlast existiert.

## URL-Parsing und Remote-Fetch

Der browserseitige Importpfad akzeptiert:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

Die Implementierung sollte beide Formen normalisieren zu:

- `https://tweakcn.com/r/themes/{id}`

Der Browser ruft dann direkt den normalisierten Endpunkt `/r/themes/{id}` ab.

Verwenden Sie einen schmalen Schema-Validator für die externe Nutzlast. Ein zod-Schema wird bevorzugt, da dies eine nicht vertrauenswürdige externe Grenze ist.

Erforderliche Remote-Felder:

- oberstes `name` als optionaler String
- `cssVars.theme` als optionales Objekt
- `cssVars.light` als Objekt
- `cssVars.dark` als Objekt

Wenn entweder `cssVars.light` oder `cssVars.dark` fehlt, lehnen Sie den Import ab. Das ist beabsichtigt: Das genehmigte Produktverhalten ist vollständige Modusunterstützung, nicht die Best-Effort-Synthese einer fehlenden Seite.

## Token-Mapping

Spiegeln Sie tweakcn-Variablen nicht blind. Normalisieren Sie eine begrenzte Teilmenge in OpenClaw-Token und leiten Sie den Rest in einem Helper ab.

### Direkt importierte Token

Aus jedem tweakcn-Modusblock:

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

Aus gemeinsamem `cssVars.theme`, wenn vorhanden:

- `font-sans`
- `font-mono`

Wenn ein Modusblock `font-sans`, `font-mono` oder `radius` überschreibt, hat der moduslokale Wert Vorrang.

### Für OpenClaw abgeleitete Token

Der Importer leitet OpenClaw-eigene Variablen aus den importierten Basisfarben ab:

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

Die Ableitungsregeln liegen in einem reinen Helper, damit sie unabhängig getestet werden können. Exakte Formeln zum Mischen von Farben sind ein Implementierungsdetail, aber der Helper muss zwei Bedingungen erfüllen:

- lesbaren Kontrast nahe an der Absicht des importierten Themes bewahren
- für dieselbe importierte Nutzlast eine stabile Ausgabe erzeugen

### In v1 ignorierte Token

Diese tweakcn-Token werden in der ersten Version absichtlich ignoriert:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Dadurch bleibt der Umfang auf die Token beschränkt, die die aktuelle Control UI tatsächlich benötigt.

### Schriftarten

Schriftstapel-Strings werden importiert, wenn vorhanden, aber OpenClaw lädt in v1 keine entfernten Schrift-Assets. Wenn der importierte Stapel auf Schriftarten verweist, die im Browser nicht verfügbar sind, greift das normale Fallback-Verhalten.

## Fehlerverhalten

Fehlerhafte Importe müssen fail-closed sein.

- Ungültiges URL-Format: Inline-Validierungsfehler anzeigen, nichts abrufen.
- Nicht unterstützter Host oder Pfadform: Inline-Validierungsfehler anzeigen, nichts abrufen.
- Netzwerkfehler, Nicht-OK-Antwort oder fehlerhaftes JSON: Inline-Fehler anzeigen, die aktuell gespeicherte Nutzlast unverändert lassen.
- Schemafehler oder fehlende Blöcke für `light`/`dark`: Inline-Fehler anzeigen, die aktuell gespeicherte Nutzlast unverändert lassen.
- Aktion `Clear`:
  - entfernt die gespeicherte benutzerdefinierte Nutzlast
  - entfernt den Inhalt des verwalteten benutzerdefinierten Style-Tags
  - wenn `custom` aktiv ist, wird die Theme-Familie auf `claw` zurückgesetzt
- Ungültige gespeicherte benutzerdefinierte Nutzlast beim ersten Laden:
  - gespeicherte Nutzlast ignorieren
  - kein benutzerdefiniertes CSS ausgeben
  - wenn die persistierte Theme-Familie `custom` war, auf `claw` zurückfallen

Ein fehlgeschlagener Import darf zu keinem Zeitpunkt dazu führen, dass auf das aktive Dokument teilweise benutzerdefinierte CSS-Variablen angewendet werden.

## Dateien, die sich in der Implementierung voraussichtlich ändern

Primäre Dateien:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Wahrscheinliche neue Helper:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

Tests:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- neue fokussierte Tests für URL-Parsing und Normalisierung der Nutzlast

## Testen

Minimale Abdeckung der Implementierung:

- Share-Link-URL in tweakcn-Theme-ID parsen
- `/themes/{id}` und `/r/themes/{id}` in die Fetch-URL normalisieren
- nicht unterstützte Hosts und fehlerhafte IDs ablehnen
- die Form der tweakcn-Nutzlast validieren
- eine gültige tweakcn-Nutzlast in normalisierte helle und dunkle OpenClaw-Token-Maps überführen
- die benutzerdefinierte Nutzlast in browserlokalen Einstellungen laden und speichern
- `custom` für `light`, `dark` und `system` auflösen
- Auswahl von `Custom` deaktivieren, wenn keine Nutzlast existiert
- importiertes Theme sofort anwenden, wenn `custom` bereits aktiv ist
- auf `claw` zurückfallen, wenn das aktive benutzerdefinierte Theme gelöscht wird

Ziel für manuelle Verifikation:

- ein bekanntes tweakcn-Theme aus den Settings importieren
- zwischen `light`, `dark` und `system` wechseln
- zwischen `custom` und den integrierten Familien wechseln
- die Seite neu laden und bestätigen, dass das importierte benutzerdefinierte Theme lokal erhalten bleibt

## Hinweise zum Rollout

Dieses Feature ist absichtlich klein gehalten. Wenn Benutzer später mehrere importierte Themes, Umbenennung, Export oder geräteübergreifende Synchronisierung wünschen, behandeln Sie das als nachgelagertes Design. Bauen Sie in dieser Implementierung nicht vorab eine Abstraktion für eine Theme-Bibliothek.
