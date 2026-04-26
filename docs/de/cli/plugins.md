---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten.
    - Sie möchten Plugin-Ladefehler debuggen.
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (auflisten, installieren, Marketplace, deinstallieren, aktivieren/deaktivieren, Doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:26:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Gateway-Plugins, Hook-Pakete und kompatible Bundles verwalten.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Endbenutzerleitfaden zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Kompatibilitätsmodell für Bundles.
  </Card>
  <Card title="Plugin-Manifest" href="/de/plugins/manifest">
    Manifestfelder und Konfigurationsschema.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security">
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON-Schema (`configSchema`, auch wenn es leer ist) enthalten. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Die ausführliche Ausgabe von list/info zeigt zusätzlich den Bundle-Subtyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Funktionen.
</Note>

### Installieren

```bash
openclaw plugins install <package>                      # zuerst ClawHub, dann npm
openclaw plugins install clawhub:<package>              # nur ClawHub
openclaw plugins install <package> --force              # vorhandene Installation überschreiben
openclaw plugins install <package> --pin                # Version anheften
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # lokaler Pfad
openclaw plugins install <plugin>@<marketplace>         # Marketplace
openclaw plugins install <plugin> --marketplace <name>  # Marketplace (explizit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Einfache Paketnamen werden zuerst in ClawHub und danach in npm gesucht. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie angeheftete Versionen.
</Warning>

<AccordionGroup>
  <Accordion title="Konfigurations-Includes und Wiederherstellung bei ungültiger Konfiguration">
    Wenn Ihr Abschnitt `plugins` durch ein einteiliges `$include` gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit benachbarten Überschreibungen schlagen kontrolliert fehl, statt abgeflacht zu werden. Siehe [Konfigurations-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration ungültig ist, schlägt `plugins install` normalerweise kontrolliert fehl und fordert Sie auf, zuerst `openclaw doctor --fix` auszuführen. Die einzige dokumentierte Ausnahme ist ein enger Wiederherstellungspfad für gebündelte Plugins bei Plugins, die sich explizit für `openclaw.install.allowInvalidConfigRecovery` anmelden.

  </Accordion>
  <Accordion title="--force und Neuinstallation vs. Update">
    `--force` verwendet das vorhandene Installationsziel erneut und überschreibt ein bereits installiertes Plugin oder Hook-Paket direkt an Ort und Stelle. Verwenden Sie dies, wenn Sie absichtlich dieselbe ID aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für reguläre Upgrades eines bereits verfolgten npm-Plugins sollten Sie `openclaw plugins update <id-or-npm-spec>` bevorzugen.

    Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Umfang von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird mit `--marketplace` nicht unterstützt, weil Marketplace-Installationen Metadaten zur Marketplace-Quelle statt einer npm-Spezifikation speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Notfalloption für False Positives im integrierten Scanner für gefährlichen Code. Sie erlaubt das Fortsetzen der Installation auch dann, wenn der integrierte Scanner Befunde mit `critical` meldet, umgeht jedoch **nicht** Richtlinienblockierungen durch den Plugin-Hook `before_install` und umgeht **nicht** Scan-Fehler.

    Dieses CLI-Flag gilt für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Installationen von Skill-Abhängigkeiten verwenden die entsprechende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` weiterhin ein separater ClawHub-Skill-Download-/Installationsablauf bleibt.

  </Accordion>
  <Accordion title="Hook-Pakete und npm-Spezifikationen">
    `plugins install` ist auch die Installationsoberfläche für Hook-Pakete, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung pro Hook, nicht für die Paketinstallation.

    npm-Spezifikationen sind **nur Registry-basiert** (Paketname + optionale **exakte Version** oder **dist-tag**). Git-/URL-/Datei-Spezifikationen und SemVer-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen projektlokal mit `--ignore-scripts`, auch wenn Ihre Shell globale npm-Installationseinstellungen hat.

    Einfache Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eine davon auf eine Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, dies explizit mit einem Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversionsnummer wie `@1.2.3-beta.4` zu aktivieren.

    Wenn eine einfache Installationsspezifikation mit einer gebündelten Plugin-ID übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw das gebündelte Plugin direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite Scoped-Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen eine gültige `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Installationen aus dem Claude-Marketplace werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten Locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw bevorzugt jetzt auch ClawHub für einfache npm-sichere Plugin-Spezifikationen. Es fällt nur dann auf npm zurück, wenn ClawHub dieses Paket oder diese Version nicht hat:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw lädt das Paketarchiv von ClawHub herunter, prüft die beworbene Plugin-API-/Mindest-Gateway-Kompatibilität und installiert es dann über den normalen Archivpfad. Aufgezeichnete Installationen behalten ihre Metadaten zur ClawHub-Quelle für spätere Updates.

#### Marketplace-Kurzform

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name im lokalen Registry-Cache von Claude unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marketplace-Quelle explizit angeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace-Quellen">
    - ein Claude-Name eines bekannten Marketplace aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marketplace-Root oder `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzform wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine git-URL
  </Tab>
  <Tab title="Regeln für entfernte Marketplace">
    Für entfernte Marketplace, die aus GitHub oder git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repository und lehnt HTTP(S)-, absolute Pfad-, git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus entfernten Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standard-Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden im normalen Plugin-Root installiert und nehmen am selben list/info/enable/disable-Ablauf teil. Aktuell werden Bundle-Skills, Claude-Befehlsskills, Claude-Standardeinstellungen aus `settings.json`, Claude-Standardeinstellungen aus `.lsp.json` / Manifest-deklarierten `lspServers`, Cursor-Befehlsskills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Funktionen werden in Diagnosen/info angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.
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
  Von der Tabellenansicht auf Detailzeilen pro Plugin mit Metadaten zu Quelle/Ursprung/Version/Aktivierung umschalten.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbares Inventar plus Registry-Diagnosen.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem abgeleiteten Fallback nur aus dem Manifest, wenn die Registry fehlt oder ungültig ist. Es ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Kaltstartplanung sichtbar ist, aber es ist keine Live-Laufzeitprüfung eines bereits laufenden Gateway-Prozesses. Nach Änderungen am Plugin-Code, an der Aktivierung, an der Hook-Richtlinie oder an `plugins.load.paths` starten Sie das Gateway, das den Kanal bedient, neu, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Bei Remote-/Container-Bereitstellungen vergewissern Sie sich, dass Sie tatsächlich den Child-Prozess `openclaw gateway run` neu starten und nicht nur einen Wrapper-Prozess.
</Note>

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images mounten Sie das Plugin-Quellverzeichnis per Bind-Mount über den passenden paketierten Quellpfad, zum Beispiel
`/app/extensions/synology-chat`. OpenClaw erkennt diese gemountete Quellüberlagerung
vor `/app/dist/extensions/synology-chat`; ein nur kopiertes Quellverzeichnis bleibt
wirkungslos, sodass normale paketierte Installationen weiterhin die kompilierte Dist verwenden.

Für das Debuggen von Laufzeit-Hooks:

- `openclaw plugins inspect <id> --json` zeigt registrierte Hooks und Diagnosen aus einem modulgeladenen Inspektionsdurchlauf.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Service-/Prozesshinweise, den Konfigurationspfad und die RPC-Integrität.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (wird zu `plugins.load.paths` hinzugefügt):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, da verknüpfte Installationen den Quellpfad wiederverwenden, statt ein verwaltetes Installationsziel zu überschreiben.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Metadaten zur Plugin-Installation sind maschinell verwalteter Zustand, keine Benutzerkonfiguration. Installationen und Updates schreiben sie nach `plugins/installs.json` unter dem aktiven OpenClaw-Zustandsverzeichnis. Die Map `installRecords` auf oberster Ebene ist die dauerhafte Quelle für Installationsmetadaten, einschließlich Einträgen für defekte oder fehlende Plugin-Manifeste. Das Array `plugins` ist der vom Manifest abgeleitete Kalt-Registry-Cache. Die Datei enthält einen Warnhinweis, dass sie nicht bearbeitet werden soll, und wird von `openclaw plugins update`, der Deinstallation, Diagnosen und der kalten Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte veraltete `plugins.installs`-Einträge in der Konfiguration sieht, verschiebt es sie in den Plugin-Index und entfernt den Konfigurationsschlüssel; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationseinträge erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, dem persistenten Plugin-Index, Plugin-Listen zum Erlauben/Verweigern sowie verknüpfte Einträge in `plugins.load.paths`, sofern zutreffend. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation auch das verfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb des Plugin-Erweiterungs-Root von OpenClaw befindet. Bei Active Memory-Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

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

Updates gelten für verfolgte Plugin-Installationen im verwalteten Plugin-Index und verfolgte Hook-Paket-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-ID vs. npm-Spezifikation auflösen">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin erneut. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt angeheftete Versionen auch bei späteren Ausführungen von `update <id>` weiterverwendet werden.

    Für npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den verfolgten Plugin-Datensatz auf, aktualisiert dieses installierte Plugin und speichert die neue npm-Spezifikation für zukünftige ID-basierte Updates.

    Die Übergabe des npm-Paketnamens ohne Version oder Tag wird ebenfalls zurück auf den verfolgten Plugin-Datensatz aufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version angeheftet war und Sie es wieder auf die Standard-Release-Linie der Registry zurückführen möchten.

  </Accordion>
  <Accordion title="Versionsprüfungen und Integritätsdrift">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen die Metadaten der npm-Registry. Wenn installierte Version und aufgezeichnete Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird das Update übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash existiert und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als Drift des npm-Artefakts. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach einer Bestätigung. Nicht interaktive Update-Helfer schlagen kontrolliert fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie angibt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bei Updates">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Notfallüberschreibung für False Positives des integrierten Scans auf gefährlichen Code während Plugin-Updates verfügbar. Es umgeht weiterhin keine Richtlinienblockierungen durch den Plugin-Hook `before_install` oder Blockierungen durch fehlgeschlagene Scans und gilt nur für Plugin-Updates, nicht für Hook-Paket-Updates.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tiefe Inspektion für ein einzelnes Plugin. Zeigt Identität, Ladestatus, Quelle, registrierte Fähigkeiten, Hooks, Tools, Befehle, Services, Gateway-Methoden, HTTP-Routen, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und erkannte Unterstützung für MCP- oder LSP-Server.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein Plugin nur für Provider)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Services, aber keine Fähigkeiten

Siehe [Plugin-Formen](/de/plugins/architecture#plugin-shapes) für mehr zum Fähigkeitsmodell.

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der für Skripting und Audits geeignet ist. `inspect --all` rendert eine tabellenartige Übersicht über die gesamte Flotte mit Spalten für Form, Fähigkeitstypen, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Diagnosen zu Manifest/Erkennung und Kompatibilitätshinweise. Wenn alles sauber ist, wird `No plugin issues detected.` ausgegeben.

Bei Modulformfehlern wie fehlenden Exporten `register`/`activate` führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportform in die Diagnoseausgabe einzubeziehen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte Kaltlesemodell von OpenClaw für installierte Plugin-Identität, Aktivierung, Quellmetadaten und Besitz von Beiträgen. Normaler Start, Lookup von Provider-Besitzern, Klassifizierung der Kanaleinrichtung und Plugin-Inventar können sie lesen, ohne Laufzeitmodule von Plugins zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistenten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Laufzeit-Aktivierungspfad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Notfall-Kompatibilitätsschalter für Fehler beim Lesen der Registry. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Umgebungsvariablen-Fallback ist nur für die Notfall-Wiederherstellung beim Start gedacht, während die Migration ausgerollt wird.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

`marketplace list` akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine git-URL. `--json` gibt die aufgelöste Quellenbezeichnung plus das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [Community-Plugins](/de/plugins/community)
