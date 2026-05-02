---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Fehler beim Laden von Plugins debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (auflisten, installieren, Marketplace, deinstallieren, aktivieren/deaktivieren, Diagnose)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T20:44:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
    source_path: cli/plugins.md
    workflow: 16
---

Gateway-Plugins, Hook-Packs und kompatible Bundles verwalten.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflisten, Aktualisierung, Deinstallation und Veröffentlichung.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Bundle-Kompatibilitätsmodell.
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
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
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

Führen Sie zur Untersuchung langsamer Installations-, Inspektions-, Deinstallations- oder Registry-Aktualisierungsvorgänge den Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasen-Timings nach stderr und hält die JSON-Ausgabe parsebar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem Inline-JSON-Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche Listen-/Info-Ausgaben zeigen außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Fähigkeiten.
</Note>

### Installieren

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Bloße Paketnamen werden während des Launch-Cutovers standardmäßig aus npm installiert. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt installationsbereite Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete, nicht Skills. Verwenden Sie `openclaw skills search` für ClawHub Skills.

<Note>
ClawHub ist die primäre Distributions- und Discovery-Oberfläche für die meisten Plugins. Npm bleibt ein unterstützter Fallback und Direktinstallationspfad. Während der Migration zu ClawHub liefert OpenClaw weiterhin einige OpenClaw-eigene `@openclaw/*` Plugin-Pakete auf npm aus; diese Paketversionen können zwischen Plugin-Release-Zügen hinter dem gebündelten Quellcode zurückliegen. Wenn npm ein OpenClaw-eigenes Plugin-Paket als veraltet meldet, ist diese veröffentlichte Version ein altes externes Artefakt; verwenden Sie das mit dem aktuellen OpenClaw gebündelte Plugin oder einen lokalen Checkout, bis ein neueres npm-Paket veröffentlicht ist.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurations-Includes und Wiederherstellung bei ungültiger Konfiguration">
    Wenn Ihr Abschnitt `plugins` durch ein Ein-Datei-`$include` gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit benachbarten Overrides schlagen geschlossen fehl, statt abgeflacht zu werden. Die unterstützten Formen finden Sie unter [Konfigurations-Includes](/de/gateway/configuration).

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Während des Gateway-Starts wird eine ungültige Konfiguration für ein Plugin auf dieses Plugin isoliert, sodass andere Kanäle und Plugins weiterlaufen können; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag quarantänisieren. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins für Plugins, die sich ausdrücklich für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force und Neuinstallation gegenüber Aktualisierung">
    `--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes Plugin oder Hook-Pack an Ort und Stelle. Verwenden Sie es, wenn Sie dieselbe ID absichtlich von einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits nachverfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine bereits installierte Plugin-ID ausführen, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird bei `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Ref wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine gepinnte Quelle wünschen. Es wird nicht mit `--marketplace` unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Break-Glass-Option für falsch positive Treffer im integrierten Scanner für gefährlichen Code. Sie erlaubt, die Installation fortzusetzen, auch wenn der integrierte Scanner `critical`-Befunde meldet, umgeht aber **nicht** Richtlinienblocks von Plugin-`before_install`-Hooks und umgeht **nicht** Scan-Fehler.

    Dieses CLI-Flag gilt für Plugin-Installations-/Aktualisierungsabläufe. Gateway-gestützte Skill-Abhängigkeitsinstallationen verwenden den passenden Request-Override `dangerouslyForceUnsafeInstall`, während `openclaw skills install` ein separater ClawHub-Ablauf zum Herunterladen/Installieren von Skills bleibt.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte unter [ClawHub](/de/tools/clawhub).

  </Accordion>
  <Accordion title="Hook-Packs und npm-Spezifikationen">
    `plugins install` ist auch die Installationsoberfläche für Hook-Packs, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung pro Hook, nicht für die Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname + optionale **exakte Version** oder **dist-tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen zur Sicherheit projektlokal mit `--ignore-scripts`, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Bloße Paketspezifikationen installieren während des Launch-Cutovers ebenfalls direkt aus npm.

    Bloße Spezifikationen und `@latest` bleiben auf dem Stable-Track. Wenn npm eines davon zu einer Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversion wie `@1.2.3-beta.4` dafür zu entscheiden.

    Wenn eine bloße Installationsspezifikation mit einer offiziellen Plugin-ID übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite Scoped-Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, Tag oder Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Ref aus, sofern vorhanden, und verwenden dann den normalen Installer für Plugin-Verzeichnisse. Das bedeutet, dass Manifestvalidierung, Scannen auf gefährlichen Code, Paketmanager-Installationsarbeit und Installationsdatensätze sich wie bei npm-Installationen verhalten. Aufgezeichnete Git-Installationen enthalten die Quell-URL/Ref sowie den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Verwenden Sie nach der Installation aus Git `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu prüfen. Wenn das Plugin mit `api.registerCli` eine CLI-Root registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bloße npm-sichere Plugin-Spezifikationen installieren während des Launch-Cutovers standardmäßig aus npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um die reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft vor der Installation die beworbene Plugin-API-/Mindest-Gateway-Kompatibilität. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-Pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es dann über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den Legacy-Paketarchiv-Verifizierungspfad installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Aktualisierungen.
Unversionierte ClawHub-Installationen behalten eine unversionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gepinnt.

#### Marketplace-Kurzform

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

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
  <Tab title="Marketplace-Quellen">
    - ein Claude-Name für einen bekannten Marketplace aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marketplace-Stamm oder ein `marketplace.json`-Pfad
    - eine GitHub-Repository-Kurzform wie `owner/repo`
    - eine GitHub-Repository-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Regeln für Remote-Marketplaces">
    Für Remote-Marketplaces, die aus GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repository und weist HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten zurück.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standardlayout für Claude-Komponenten)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden in den normalen Plugin-Stamm installiert und nehmen am gleichen Ablauf für Auflisten/Informationen/Aktivieren/Deaktivieren teil. Heute werden Bundle-Skills, Claude-Befehls-Skills, Claude-Standardwerte aus `settings.json`, Claude-Standardwerte aus `.lsp.json` / im Manifest deklarierten `lspServers`, Cursor-Befehls-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnosen/Informationen angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.
</Note>

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Nur aktivierte Plugins anzeigen.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Metadaten zu Quelle/Ursprung/Version/Aktivierung wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbares Inventar plus Registry-Diagnosen und Installationsstatus von Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die dauerhaft gespeicherte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Kaltstartplanung sichtbar ist, ist aber keine Live-Laufzeitprüfung eines bereits laufenden Gateway-Prozesses. Nachdem Sie Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` geändert haben, starten Sie den Gateway neu, der den Kanal bereitstellt, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Prüfen Sie bei Remote-/Container-Bereitstellungen, dass Sie den tatsächlichen untergeordneten Prozess `openclaw gateway run` neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält für jedes Plugin dessen `dependencyStatus` aus `package.json`
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen entlang des normalen Node-`node_modules`-Suchpfads des Plugins vorhanden sind; es importiert keinen Plugin-Laufzeitcode, führt keinen Paketmanager aus und repariert keine fehlenden Abhängigkeiten.
</Note>

`plugins search` ist eine Remote-Katalogsuche in ClawHub. Sie prüft keinen lokalen
Zustand, verändert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Laufzeitcode. Suchergebnisse enthalten den ClawHub-Paketnamen, die Familie, den Kanal, die Version, die Zusammenfassung und
einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für Arbeit an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das Plugin-
Quellverzeichnis über den passenden paketierten Quellpfad ein, zum Beispiel
`/app/extensions/synology-chat`. OpenClaw erkennt diese eingehängte Quell-
Überlagerung vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quell-
Verzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin die kompilierte Distribution verwenden.

Für Laufzeit-Hook-Debugging:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Prüfungsdurchlauf mit geladenem Modul. Die Laufzeitprüfung installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um veralteten Abhängigkeitszustand zu bereinigen oder fehlende konfigurierte herunterladbare Plugins zu installieren.
- `openclaw gateway status --deep --require-rpc` bestätigt den erreichbaren Gateway, Dienst-/Prozesshinweise, den Konfigurationspfad und den RPC-Zustand.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, statt ein verwaltetes Installationsziel zu überschreiben.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinell verwalteter Zustand, keine Benutzerkonfiguration. Installationen und Aktualisierungen schreiben sie nach `plugins/installs.json` im aktiven OpenClaw-Zustandsverzeichnis. Die Zuordnung `installRecords` auf oberster Ebene ist die dauerhafte Quelle der Installationsmetadaten, einschließlich Datensätzen für defekte oder fehlende Plugin-Manifeste. Das Array `plugins` ist der aus Manifesten abgeleitete Kalt-Registry-Zwischenspeicher. Die Datei enthält eine Nicht-bearbeiten-Warnung und wird von `openclaw plugins update`, Deinstallation, Diagnosen und der Kalt-Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte veraltete `plugins.installs`-Datensätze in der Konfiguration erkennt, verschiebt es sie in den Plugin-Index und entfernt den Konfigurationsschlüssel; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationsdatensätze erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem dauerhaft gespeicherten Plugin-Index, Plugin-Zulassungs-/Sperrlisteneinträgen und, falls zutreffend, verknüpften `plugins.load.paths`-Einträgen. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb des Plugin-Erweiterungsstamms von OpenClaw befindet. Bei Active Memory-Plugins wird der Speicherplatz auf `memory-core` zurückgesetzt.

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

Aktualisierungen gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und nachverfolgte Hook-Pack-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-ID gegenüber npm-Spezifikation auflösen">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin wieder. Das bedeutet, dass zuvor gespeicherte Distribution-Tags wie `@beta` und exakt gepinnte Versionen bei späteren `update <id>`-Ausführungen weiterhin verwendet werden.

    Bei npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem Distribution-Tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den nachverfolgten Plugin-Datensatz auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für künftige ID-basierte Aktualisierungen auf.

    Das Übergeben des npm-Paketnamens ohne Version oder Tag wird ebenfalls zurück auf den nachverfolgten Plugin-Datensatz aufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version gepinnt war und Sie es wieder auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Aktualisierungen im Beta-Kanal">
    `openclaw plugins update` verwendet die nachverfolgte Plugin-Spezifikation wieder, sofern Sie keine neue Spezifikation übergeben. `openclaw update` kennt zusätzlich den aktiven OpenClaw-Aktualisierungskanal: Im Beta-Kanal versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta` und fallen dann auf die aufgezeichnete Standard-/neueste Spezifikation zurück, wenn kein Plugin-Beta-Release vorhanden ist. Exakte Versionen und explizite Tags bleiben an diesen Selektor gepinnt.

  </Accordion>
  <Accordion title="Versionsprüfungen und Integritätsabweichung">
    Vor einer Live-npm-Aktualisierung prüft OpenClaw die installierte Paketversion anhand der npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird die Aktualisierung übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefaktabweichung. Der interaktive Befehl `openclaw plugins update` gibt den erwarteten und den tatsächlichen Hash aus und fragt vor dem Fortfahren nach Bestätigung. Nicht interaktive Aktualisierungshelfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie angibt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bei Aktualisierung">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Notfall-Override für Fehlalarme der integrierten Prüfung auf gefährlichen Code während Plugin-Aktualisierungen verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtlinienblockaden oder Blockierungen bei Prüfungsfehlern und gilt nur für Plugin-Aktualisierungen, nicht für Hook-Pack-Aktualisierungen.
  </Accordion>
</AccordionGroup>

### Prüfen

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Die Prüfung zeigt Identität, Ladestatus, Quelle, Manifestfähigkeiten, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und jede erkannte MCP- oder LSP-Serverunterstützung, ohne standardmäßig Plugin-Laufzeit zu importieren. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Werkzeuge, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzuschließen. Die Laufzeitprüfung meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden als Stamm-Befehlsgruppen von `openclaw` installiert. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` anzeigt, führen Sie ihn als `openclaw <command> ...` aus; zum Beispiel kann ein Plugin, das `demo-git` registriert, mit `openclaw demo-git ping` geprüft werden.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Werkzeuge/Befehle/Dienste, aber keine Fähigkeiten

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Audits eignet. `inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Fähigkeitsarten, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Erkennungsdiagnosen und Kompatibilitätshinweise. Wenn alles bereinigt ist, gibt es `No plugin issues detected.` aus.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exporten führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Exportform-Zusammenfassung in der Diagnoseausgabe einzuschließen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das dauerhaft gespeicherte Kaltlesemodell von OpenClaw für installierte Plugin-Identität, Aktivierung, Quellenmetadaten und Beitragszuständigkeit. Normaler Start, Provider-Eigentümersuche, Klassifizierung der Kanaleinrichtung und Plugin-Inventar können sie lesen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die dauerhaft gespeicherte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem dauerhaft gespeicherten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Laufzeitaktivierungspfad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Lesefehler der Registry. Verwenden Sie bevorzugt `plugins registry --refresh` oder `openclaw doctor --fix`; der Fallback über die Umgebungsvariable ist nur für die Notfallwiederherstellung beim Start vorgesehen, während die Migration ausgerollt wird.
</Warning>

### Marktplatz

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Der Befehl `marketplace list` akzeptiert einen lokalen Marktplatzpfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt die aufgelöste Quellbezeichnung sowie das geparste Marktplatzmanifest und die Plugin-Einträge aus.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [Community-Plugins](/de/plugins/community)
