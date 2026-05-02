---
x-i18n:
    generated_at: "2026-05-02T22:22:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Design für den Import benutzerdefinierter Tweakcn-Themes

Status: am 2026-04-22 im Terminal genehmigt

## Zusammenfassung

Fügen Sie genau einen browserlokalen benutzerdefinierten Control UI-Theme-Slot hinzu, der aus einem tweakcn-Freigabelink importiert werden kann. Die vorhandenen integrierten Theme-Familien bleiben `claw`, `knot` und `dash`. Die neue Familie `custom` verhält sich wie eine normale OpenClaw-Theme-Familie und unterstützt den Modus `light`, `dark` und `system`, wenn die importierte tweakcn-Payload sowohl helle als auch dunkle Token-Sets enthält.

Das importierte Theme wird nur im aktuellen Browserprofil zusammen mit den übrigen Control UI-Einstellungen gespeichert. Es wird nicht in die Gateway-Konfiguration geschrieben und nicht geräte- oder browserübergreifend synchronisiert.

## Problem

Das Theme-System der Control UI ist derzeit auf drei hartcodierte Theme-Familien beschränkt:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Benutzer können zwischen integrierten Familien und Modusvarianten wechseln, aber sie können kein Theme aus tweakcn einbinden, ohne das CSS des Repos zu bearbeiten. Das gewünschte Ergebnis ist kleiner als ein allgemeines Theming-System: Die drei integrierten Themes bleiben erhalten, und es wird ein vom Benutzer gesteuerter Import-Slot hinzugefügt, der über einen tweakcn-Link ersetzt werden kann.

## Ziele

- Die vorhandenen integrierten Theme-Familien unverändert beibehalten.
- Genau einen importierten benutzerdefinierten Slot hinzufügen, keine Theme-Bibliothek.
- Einen tweakcn-Freigabelink oder eine direkte `https://tweakcn.com/r/themes/{id}`-URL akzeptieren.
- Das importierte Theme nur im lokalen Speicher des Browsers speichern.
- Den importierten Slot mit den vorhandenen Modussteuerungen `light`, `dark` und `system` nutzbar machen.
- Sicheres Fehlerverhalten beibehalten: Ein fehlerhafter Import beschädigt niemals das aktive UI-Theme.

## Nichtziele

- Keine Bibliothek mit mehreren Themes oder browserlokale Liste von Importen.
- Keine Gateway-seitige Persistenz oder geräteübergreifende Synchronisierung.
- Kein beliebiger CSS-Editor oder Editor für rohe Theme-JSON-Daten.
- Kein automatisches Laden entfernter Font-Assets von tweakcn.
- Kein Versuch, tweakcn-Payloads zu unterstützen, die nur einen Modus bereitstellen.
- Kein repo-weites Theming-Refactoring über die für die Control UI erforderlichen Schnittstellen hinaus.

## Bereits getroffene Benutzerentscheidungen

- Die drei integrierten Themes beibehalten.
- Einen durch tweakcn gestützten Import-Slot hinzufügen.
- Das importierte Theme im Browser speichern, nicht in der Gateway-Konfiguration.
- `light`, `dark` und `system` für den importierten Slot unterstützen.
- Das Überschreiben des benutzerdefinierten Slots mit dem nächsten Import ist das beabsichtigte Verhalten.

## Empfohlener Ansatz

Fügen Sie dem Theme-Modell der Control UI eine vierte Theme-Familien-ID hinzu: `custom`. Die Familie `custom` wird nur auswählbar, wenn ein gültiger tweakcn-Import vorhanden ist. Die importierte Payload wird in einen OpenClaw-spezifischen benutzerdefinierten Theme-Datensatz normalisiert und zusammen mit den übrigen UI-Einstellungen im lokalen Speicher des Browsers gespeichert.

Zur Laufzeit rendert OpenClaw ein verwaltetes `<style>`-Tag, das die aufgelösten benutzerdefinierten CSS-Variablenblöcke definiert:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Dadurch bleiben benutzerdefinierte Theme-Variablen auf die Familie `custom` beschränkt, und Inline-CSS-Variablen laufen nicht in die integrierten Familien hinein.

## Architektur

### Theme-Modell

Aktualisieren Sie `ui/src/ui/theme.ts`:

- `ThemeName` um `custom` erweitern.
- `ResolvedTheme` um `custom` und `custom-light` erweitern.
- `VALID_THEME_NAMES` erweitern.
- `resolveTheme()` aktualisieren, sodass `custom` das vorhandene Familienverhalten spiegelt:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` oder `custom-light` basierend auf der Betriebssystempräferenz

Für `custom` werden keine Legacy-Aliase hinzugefügt.

### Persistenzmodell

Erweitern Sie die `UiSettings`-Persistenz in `ui/src/ui/storage.ts` um eine optionale benutzerdefinierte Theme-Payload:

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
- `label` ist das tweakcn-Feld `name`, falls vorhanden, andernfalls `Custom`.
- `light` und `dark` sind bereits normalisierte OpenClaw-Token-Maps, keine rohen tweakcn-Payloads.
- Die importierte Payload liegt neben anderen browserlokalen Einstellungen und wird im selben Local-Storage-Dokument serialisiert.
- Wenn gespeicherte benutzerdefinierte Theme-Daten beim Laden fehlen oder ungültig sind, ignorieren Sie die Payload und fallen Sie auf `theme: "claw"` zurück, wenn die persistierte Familie `custom` war.

### Laufzeitanwendung

Fügen Sie in der Control UI-Laufzeit einen schmalen Stylesheet-Manager für benutzerdefinierte Themes hinzu, angesiedelt in der Nähe von `ui/src/ui/app-settings.ts` und `ui/src/ui/theme.ts`.

Verantwortlichkeiten:

- Ein stabiles `<style id="openclaw-custom-theme">`-Tag in `document.head` erstellen oder aktualisieren.
- CSS nur ausgeben, wenn eine gültige benutzerdefinierte Theme-Payload vorhanden ist.
- Den Inhalt des Style-Tags entfernen, wenn die Payload gelöscht wird.
- CSS für integrierte Familien in `ui/src/styles/base.css` belassen; importierte Tokens nicht in das eingecheckte Stylesheet einfügen.

Dieser Manager läuft immer dann, wenn Einstellungen geladen, gespeichert, importiert oder gelöscht werden.

### Selektoren für hellen Modus

Die Implementierung sollte `data-theme-mode="light"` für familienübergreifendes Styling im hellen Modus bevorzugen, statt `custom-light` speziell zu behandeln. Wenn ein vorhandener Selektor an `data-theme="light"` gebunden ist und für jede helle Familie gelten muss, erweitern Sie ihn im Rahmen dieser Arbeit.

## Import-UX

Aktualisieren Sie `ui/src/ui/views/config.ts` im Abschnitt `Appearance`:

- Eine `Custom`-Theme-Karte neben `Claw`, `Knot` und `Dash` hinzufügen.
- Die Karte deaktiviert anzeigen, wenn kein importiertes benutzerdefiniertes Theme vorhanden ist.
- Unter dem Theme-Raster ein Importpanel hinzufügen mit:
  - einem Texteingabefeld für einen tweakcn-Freigabelink oder eine `/r/themes/{id}`-URL
  - einer Schaltfläche `Import`
  - einem `Replace`-Pfad, wenn bereits eine benutzerdefinierte Payload existiert
  - einer `Clear`-Aktion, wenn bereits eine benutzerdefinierte Payload existiert
- Das importierte Theme-Label und den Quell-Host anzeigen, wenn eine Payload vorhanden ist.
- Wenn das aktive Theme `custom` ist, wird ein importierter Ersatz sofort angewendet.
- Wenn das aktive Theme nicht `custom` ist, speichert der Import nur die neue Payload, bis der Benutzer die Karte `Custom` auswählt.

Der Theme-Picker in den Schnelleinstellungen in `ui/src/ui/views/config-quick.ts` sollte `Custom` ebenfalls nur anzeigen, wenn eine Payload vorhanden ist.

## URL-Parsing und Remote-Abruf

Der Browser-Importpfad akzeptiert:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

Die Implementierung sollte beide Formen normalisieren zu:

- `https://tweakcn.com/r/themes/{id}`

Der Browser ruft dann den normalisierten Endpunkt `/r/themes/{id}` direkt ab.

Verwenden Sie für die externe Payload einen engen Schema-Validator. Ein zod-Schema wird bevorzugt, da dies eine nicht vertrauenswürdige externe Grenze ist.

Erforderliche Remote-Felder:

- oberste Ebene `name` als optionaler String
- `cssVars.theme` als optionales Objekt
- `cssVars.light` als Objekt
- `cssVars.dark` als Objekt

Wenn entweder `cssVars.light` oder `cssVars.dark` fehlt, lehnen Sie den Import ab. Das ist beabsichtigt: Das genehmigte Produktverhalten ist vollständige Modusunterstützung, keine Best-Effort-Synthese einer fehlenden Seite.

## Token-Zuordnung

Spiegeln Sie tweakcn-Variablen nicht blind. Normalisieren Sie eine begrenzte Teilmenge in OpenClaw-Tokens und leiten Sie den Rest in einem Helper ab.

### Direkt importierte Tokens

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

Aus gemeinsamem `cssVars.theme`, falls vorhanden:

- `font-sans`
- `font-mono`

Wenn ein Modusblock `font-sans`, `font-mono` oder `radius` überschreibt, gewinnt der moduslokale Wert.

### Für OpenClaw abgeleitete Tokens

Der Importer leitet OpenClaw-spezifische Variablen aus den importierten Basisfarben ab:

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

Ableitungsregeln liegen in einem reinen Helper, damit sie unabhängig getestet werden können. Exakte Farbmischformeln sind ein Implementierungsdetail, aber der Helper muss zwei Bedingungen erfüllen:

- lesbaren Kontrast nahe an der Intention des importierten Themes bewahren
- für dieselbe importierte Payload stabile Ausgabe erzeugen

### In v1 ignorierte Tokens

Diese tweakcn-Tokens werden in der ersten Version absichtlich ignoriert:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Dadurch bleibt der Umfang auf die Tokens beschränkt, die die aktuelle Control UI tatsächlich benötigt.

### Fonts

Font-Stack-Strings werden importiert, falls vorhanden, aber OpenClaw lädt in v1 keine entfernten Font-Assets. Wenn der importierte Stack Fonts referenziert, die im Browser nicht verfügbar sind, gilt das normale Fallback-Verhalten.

## Fehlerverhalten

Fehlerhafte Importe müssen geschlossen fehlschlagen.

- Ungültiges URL-Format: Inline-Validierungsfehler anzeigen, nicht abrufen.
- Nicht unterstützter Host oder Pfadform: Inline-Validierungsfehler anzeigen, nicht abrufen.
- Netzwerkfehler, Nicht-OK-Antwort oder fehlerhaftes JSON: Inline-Fehler anzeigen, aktuell gespeicherte Payload unverändert lassen.
- Schemafehler oder fehlende light/dark-Blöcke: Inline-Fehler anzeigen, aktuell gespeicherte Payload unverändert lassen.
- Clear-Aktion:
  - entfernt die gespeicherte benutzerdefinierte Payload
  - entfernt den Inhalt des verwalteten benutzerdefinierten Style-Tags
  - wenn `custom` aktiv ist, wird die Theme-Familie zurück auf `claw` umgeschaltet
- Ungültige gespeicherte benutzerdefinierte Payload beim ersten Laden:
  - gespeicherte Payload ignorieren
  - kein benutzerdefiniertes CSS ausgeben
  - wenn die persistierte Theme-Familie `custom` war, auf `claw` zurückfallen

Zu keinem Zeitpunkt darf ein fehlgeschlagener Import das aktive Dokument mit teilweise angewendeten benutzerdefinierten CSS-Variablen zurücklassen.

## Dateien, die sich voraussichtlich bei der Implementierung ändern

Primäre Dateien:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Wahrscheinliche neue Helper:

- `ui/src/ui/custom-theme.ts`

Tests:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- neue fokussierte Tests für URL-Parsing und Payload-Normalisierung

## Tests

Minimale Implementierungsabdeckung:

- Freigabelink-URL in tweakcn-Theme-ID parsen
- `/themes/{id}` und `/r/themes/{id}` in die Abruf-URL normalisieren
- nicht unterstützte Hosts und fehlerhafte IDs ablehnen
- tweakcn-Payload-Form validieren
- eine gültige tweakcn-Payload in normalisierte helle und dunkle OpenClaw-Token-Maps abbilden
- die benutzerdefinierte Payload in browserlokalen Einstellungen laden und speichern
- `custom` für `light`, `dark` und `system` auflösen
- Auswahl von `Custom` deaktivieren, wenn keine Payload vorhanden ist
- importiertes Theme sofort anwenden, wenn `custom` bereits aktiv ist
- auf `claw` zurückfallen, wenn das aktive benutzerdefinierte Theme gelöscht wird

Ziel für manuelle Verifizierung:

- ein bekanntes tweakcn-Theme aus den Einstellungen importieren
- zwischen `light`, `dark` und `system` wechseln
- zwischen `custom` und den integrierten Familien wechseln
- die Seite neu laden und bestätigen, dass das importierte benutzerdefinierte Theme lokal erhalten bleibt

## Rollout-Hinweise

Dieses Feature ist absichtlich klein. Wenn Benutzer später nach mehreren importierten Themes, Umbenennen, Export oder geräteübergreifender Synchronisierung fragen, behandeln Sie das als nachgelagertes Design. Bauen Sie in dieser Implementierung nicht vorab eine Theme-Bibliotheksabstraktion.
