---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Pakete installieren oder verwalten
    - Sie möchten Fehler beim Laden von Plugins debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-30T06:46:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Verwalten Sie Gateway-Plugins, Hook-Packs und kompatible Bundles.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/de/tools/plugin">
    Endbenutzerhandbuch zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugin bundles" href="/de/plugins/bundles">
    Kompatibilitätsmodell für Bundles.
  </Card>
  <Card title="Plugin manifest" href="/de/plugins/manifest">
    Manifestfelder und Konfigurationsschema.
  </Card>
  <Card title="Security" href="/de/gateway/security">
    Sicherheitshärtung für Plugin-Installationen.
  </Card>
</CardGroup>

## Befehle

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Für Untersuchungen zu langsamen Installations-, Inspektions-, Deinstallations- oder Registry-Aktualisierungsvorgängen führen Sie den Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasenzeiten nach stderr und hält die JSON-Ausgabe parsbar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert, zum Beispiel gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-Plugin; andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem inline JSON Schema (`configSchema`, auch wenn es leer ist) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche list/info-Ausgaben zeigen außerdem den Bundle-Subtyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Fähigkeiten.
</Note>

### Installieren

```bash
openclaw plugins install <package>                      # ClawHub zuerst, dann npm
openclaw plugins install clawhub:<package>              # nur ClawHub
openclaw plugins install npm:<package>                  # nur npm
openclaw plugins install <package> --force              # vorhandene Installation überschreiben
openclaw plugins install <package> --pin                # Version pinnen
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # lokaler Pfad
openclaw plugins install <plugin>@<marketplace>         # Marketplace
openclaw plugins install <plugin> --marketplace <name>  # Marketplace (explizit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Reine Paketnamen werden zuerst gegen ClawHub und dann gegen npm geprüft. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

<Note>
ClawHub ist die primäre Distributions- und Entdeckungsoberfläche für die meisten Plugins. Npm bleibt ein unterstützter Fallback- und Direktinstallationspfad. Während der Migration zu ClawHub liefert OpenClaw weiterhin einige OpenClaw-eigene `@openclaw/*`-Plugin-Pakete auf npm aus; diese Paketversionen können hinter der gebündelten Quelle zwischen Plugin-Release-Zügen zurückbleiben. Wenn npm ein OpenClaw-eigenes Plugin-Paket als veraltet meldet, ist diese veröffentlichte Version ein altes externes Artefakt; verwenden Sie das mit dem aktuellen OpenClaw gebündelte Plugin oder einen lokalen Checkout, bis ein neueres npm-Paket veröffentlicht wird.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    Wenn Ihr Abschnitt `plugins` durch ein einzeldateibasiertes `$include` hinterlegt ist, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit nebengeordneten Overrides schlagen geschlossen fehl, statt abgeflacht zu werden. Siehe [Config includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und fordert Sie auf, zuerst `openclaw doctor --fix` auszuführen. Während des Gateway-Starts wird eine ungültige Konfiguration für ein Plugin auf dieses Plugin isoliert, sodass andere Channels und Plugins weiterlaufen können; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag quarantänisieren. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die sich explizit für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` verwendet das vorhandene Installationsziel erneut und überschreibt ein bereits installiertes Plugin oder Hook-Pack an Ort und Stelle. Verwenden Sie es, wenn Sie dieselbe ID bewusst aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits nachverfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine bereits installierte Plugin-ID ausführen, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` gilt nur für npm-Installationen. Es wird mit `--marketplace` nicht unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Break-Glass-Option für False Positives im eingebauten Dangerous-Code-Scanner. Sie erlaubt, die Installation fortzusetzen, selbst wenn der eingebaute Scanner `critical`-Befunde meldet, umgeht aber **nicht** Policy-Blocks von Plugin-`before_install`-Hooks und umgeht **nicht** Scan-Fehler.

    Dieses CLI-Flag gilt für Plugin-Installations-/Aktualisierungsabläufe. Gateway-gestützte Skill-Abhängigkeitsinstallationen verwenden den entsprechenden Request-Override `dangerouslyForceUnsafeInstall`, während `openclaw skills install` ein separater ClawHub-Skill-Download-/Installationsablauf bleibt.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub](/de/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` ist auch die Installationsoberfläche für Hook-Packs, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung einzelner Hooks, nicht für die Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname plus optionale **exakte Version** oder **Dist-Tag**). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen projektlokal mit `--ignore-scripts`, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat.

    Verwenden Sie `npm:<package>`, wenn Sie die ClawHub-Suche überspringen und direkt von npm installieren möchten. Reine Paketspezifikationen bevorzugen weiterhin ClawHub und fallen nur auf npm zurück, wenn ClawHub dieses Paket oder diese Version nicht hat.

    Reine Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eines davon auf ein Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` dafür zu entscheiden.

    Wenn eine reine Installationsspezifikation einer gebündelten Plugin-ID entspricht, zum Beispiel `diffs`, installiert OpenClaw das gebündelte Plugin direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizit gescopte Spezifikation, zum Beispiel `@scope/diffs`.

  </Accordion>
  <Accordion title="Archives">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw bevorzugt jetzt auch ClawHub für reine npm-sichere Plugin-Spezifikationen. Es fällt nur auf npm zurück, wenn ClawHub dieses Paket oder diese Version nicht hat:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um eine reine npm-Auflösung zu erzwingen, zum Beispiel wenn ClawHub nicht erreichbar ist oder Sie wissen, dass das Paket nur auf npm existiert:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw lädt das Paketarchiv von ClawHub herunter, prüft die angekündigte Plugin-API-/Mindest-Gateway-Kompatibilität und installiert es dann über den normalen Archivpfad. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten für spätere Aktualisierungen.
Unversionierte ClawHub-Installationen behalten eine unversionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gepinnt.

#### Marketplace-Kurzschreibweise

Verwenden Sie die Kurzschreibweise `plugin@marketplace`, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` existiert:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marketplace-Quelle explizit übergeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - ein Claude-Known-Marketplace-Name aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marketplace-Root oder `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzschreibweise wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Für Remote-Marketplaces, die von GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repo und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standard-Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden in den normalen Plugin-Root installiert und nehmen am selben list/info/enable/disable-Ablauf teil. Derzeit werden Bundle-Skills, Claude-Command-Skills, Claude-`settings.json`-Defaults, Claude-`.lsp.json`-/manifestdeklarierte `lspServers`-Defaults, Cursor-Command-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnose/Info angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.
</Note>

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Nur aktivierte Plugins anzeigen.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Quell-/Ursprungs-/Versions-/Aktivierungsmetadaten wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbares Inventar plus Registry-Diagnosen.
</ParamField>

<Note>
`plugins list` liest zuerst die dauerhaft gespeicherte lokale Plugin-Registry, mit einem nur aus dem Manifest abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Kaltstartplanung sichtbar ist, ist aber keine Live-Laufzeitprüfung eines bereits laufenden Gateway-Prozesses. Nachdem Sie Plugin-Code, Aktivierung, Hook-Richtlinien oder `plugins.load.paths` geändert haben, starten Sie das Gateway neu, das den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Vergewissern Sie sich bei Remote-/Container-Bereitstellungen, dass Sie den tatsächlichen `openclaw gateway run`-Child neu starten und nicht nur einen Wrapper-Prozess.
</Note>

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das Plugin-
Quellverzeichnis per Bind-Mount über den passenden paketierten Quellpfad ein, etwa
`/app/extensions/synology-chat`. OpenClaw erkennt dieses eingehängte Source-
Overlay vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quell-
verzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin die kompilierte Dist-Version verwenden.

Für das Debugging von Laufzeit-Hooks:

- `openclaw plugins inspect <id> --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Hinweise zu Dienst/Prozess, den Konfigurationspfad und die RPC-Integrität.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, statt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinell verwalteter Zustand, keine Benutzerkonfiguration. Installationen und Updates schreiben sie in `plugins/installs.json` unter dem aktiven OpenClaw-Zustandsverzeichnis. Die Top-Level-Map `installRecords` ist die dauerhafte Quelle der Installationsmetadaten, einschließlich Datensätzen für beschädigte oder fehlende Plugin-Manifeste. Das Array `plugins` ist der aus dem Manifest abgeleitete Kalt-Registry-Cache. Die Datei enthält eine Warnung, sie nicht zu bearbeiten, und wird von `openclaw plugins update`, Deinstallation, Diagnosen und der kalten Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte Legacy-`plugins.installs`-Datensätze in der Konfiguration erkennt, verschiebt es sie in den Plugin-Index und entfernt den Konfigurationsschlüssel; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationsdatensätze erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Laufzeitabhängigkeiten

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` prüft die paketierte Laufzeitabhängigkeitsstufe für OpenClaw-eigene gebündelte Plugins, die durch Plugin-Konfiguration, aktivierte/konfigurierte Kanäle, konfigurierte Modell-Provider oder gebündelte Manifest-Defaults ausgewählt werden. Es ist nicht der Installations-/Update-Pfad für Drittanbieter-npm- oder ClawHub-Plugins.

Verwenden Sie `--repair`, wenn eine paketierte Installation während des Gateway-Starts oder bei `plugins doctor` fehlende gebündelte Laufzeitabhängigkeiten meldet. Die Reparatur installiert nur fehlende aktivierte Abhängigkeiten gebündelter Plugins mit deaktivierten Lifecycle-Skripten. Verwenden Sie `--prune`, um veraltete unbekannte externe Laufzeitabhängigkeits-Roots zu entfernen, die von älteren paketierten Layouts zurückgelassen wurden.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem dauerhaft gespeicherten Plugin-Index, Einträgen in Plugin-Zulassungs-/Sperrlisten und gegebenenfalls verknüpften `plugins.load.paths`-Einträgen. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation auch das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb von OpenClaws Plugin-Extensions-Root befindet. Bei Active Memory-Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

<Note>
`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.
</Note>

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und nachverfolgte Hook-Pack-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Auflösen von Plugin-ID vs. npm-Spezifikation">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin wieder. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt gepinnte Versionen auch bei späteren `update <id>`-Läufen weiter verwendet werden.

    Für npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den nachverfolgten Plugin-Datensatz auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige ID-basierte Updates auf.

    Wenn Sie den npm-Paketnamen ohne Version oder Tag übergeben, wird er ebenfalls zurück auf den nachverfolgten Plugin-Datensatz aufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version gepinnt war und Sie es wieder auf die Standard-Release-Linie der Registry zurückführen möchten.

  </Accordion>
  <Accordion title="Versionsprüfungen und Integritätsdrift">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion anhand der npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird das Update übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefaktdrift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach Bestätigung. Nicht-interaktive Update-Helfer schlagen standardmäßig geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install beim Update">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Notfall-Override für False Positives der integrierten Prüfung auf gefährlichen Code während Plugin-Updates verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtliniensperren oder Blockierungen durch Prüfungsfehler und gilt nur für Plugin-Updates, nicht für Hook-Pack-Updates.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tiefe Introspektion für ein einzelnes Plugin. Zeigt Identität, Ladestatus, Quelle, registrierte Fähigkeiten, Hooks, Tools, Befehle, Dienste, Gateway-Methoden, HTTP-Routen, Richtlinienflags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und erkannte Unterstützung für MCP- oder LSP-Server.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein Provider-only-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der für Skripting und Audits geeignet ist. `inspect --all` rendert eine tabellenweite Übersicht mit Spalten für Form, Fähigkeitstypen, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und Kompatibilitätshinweise. Wenn alles sauber ist, gibt es `No plugin issues detected.` aus.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exporten führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportform in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist OpenClaws dauerhaft gespeichertes Kalt-Lesemodell für installierte Plugin-Identität, Aktivierung, Quellmetadaten und Beitragsverantwortung. Normaler Start, Provider-Owner-Lookup, Kanal-Setup-Klassifizierung und Plugin-Inventar können sie lesen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die dauerhaft gespeicherte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem dauerhaft gespeicherten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Laufzeitaktivierungspfad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Notfall-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfallwiederherstellung beim Start gedacht, während die Migration ausgerollt wird.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt die aufgelöste Quellbezeichnung sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [Community-Plugins](/de/plugins/community)
