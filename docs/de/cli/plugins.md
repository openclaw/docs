---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Plugin-Ladefehler debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-04T09:37:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Verwalten Sie Gateway-Plugins, Hook-Pakete und kompatible Bundles.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/de/tools/plugin">
    Endbenutzerleitfaden zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Manage plugins" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflisten, Aktualisierung, Deinstallation und Veröffentlichung.
  </Card>
  <Card title="Plugin bundles" href="/de/plugins/bundles">
    Bundle-Kompatibilitätsmodell.
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

Führen Sie zur Untersuchung langsamer Installations-, Prüf-, Deinstallations- oder Registry-Aktualisierungsvorgänge den
Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasen-Timings
nach stderr und hält die JSON-Ausgabe parsebar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem Inline-JSON-Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche list/info-Ausgaben zeigen außerdem den Bundle-Subtyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Funktionen.
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
Reine Paketnamen werden während der Launch-Umstellung standardmäßig von npm installiert. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt
installationsbereite Paketnamen aus. Es sucht Code-Plugin- und Bundle-Plugin-Pakete,
keine Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Distributions- und Discovery-Oberfläche für die meisten Plugins. Npm
bleibt ein unterstützter Fallback- und Direktinstallationspfad. OpenClaw-eigene
`@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie
auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im
[Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`.
Beta-Channel-Installationen und -Updates bevorzugen den npm-`beta`-Dist-Tag, wenn dieses Tag
verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Wenn Ihr Abschnitt `plugins` durch ein einzelnes Datei-`$include` gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit danebenliegenden Überschreibungen scheitern geschlossen, statt abgeflacht zu werden. Siehe [Config-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, scheitert `plugins install` normalerweise geschlossen und fordert Sie auf, zuerst `openclaw doctor --fix` auszuführen. Beim Gateway-Start und Hot Reload scheitert ungültige Plugin-Konfiguration geschlossen wie jede andere ungültige Konfiguration; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag isolieren. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die sich explizit für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes Plugin oder Hook-Paket direkt. Verwenden Sie es, wenn Sie dieselbe ID bewusst von einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` gilt nur für npm-Installationen. Es wird mit `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Referenz wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine gepinnte Quelle möchten. Es wird mit `--marketplace` nicht unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Notfalloption für falsch positive Treffer im integrierten Scanner für gefährlichen Code. Sie erlaubt, dass die Installation fortgesetzt wird, auch wenn der integrierte Scanner `critical`-Befunde meldet, umgeht aber **keine** Plugin-`before_install`-Hook-Richtlinienblöcke und umgeht **keine** Scanfehler.

    Dieses CLI-Flag gilt für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Installationen von Skill-Abhängigkeiten verwenden die entsprechende `dangerouslyForceUnsafeInstall`-Request-Überschreibung, während `openclaw skills install` ein separater ClawHub-Skill-Download-/Installationsablauf bleibt.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub](/de/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` ist auch die Installationsoberfläche für Hook-Pakete, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung einzelner Hooks, nicht für die Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname + optionale **exakte Version** oder **Dist-Tag**). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen projektlokal mit `--ignore-scripts`, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Reine Paketspezifikationen werden während der Launch-Umstellung ebenfalls direkt von npm installiert.

    Reine Spezifikationen und `@latest` bleiben auf dem stabilen Track. Datumsstempel-Korrekturversionen von OpenClaw wie `2026.5.3-1` sind für diese Prüfung stabile Releases. Wenn npm eine davon zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` zu entscheiden.

    Wenn eine reine Installationsspezifikation mit einer offiziellen Plugin-ID übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite scoped Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, ein Tag oder einen Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Referenz aus, wenn vorhanden, und verwenden dann den normalen Plugin-Verzeichnisinstaller. Das bedeutet, dass Manifestvalidierung, Scan auf gefährlichen Code, Paketmanager-Installationsarbeit und Installationsdatensätze sich wie bei npm-Installationen verhalten. Aufgezeichnete Git-Installationen enthalten die Quell-URL/Referenz sowie den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Verwenden Sie nach der Installation aus Git `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu prüfen. Wenn das Plugin eine CLI-Root mit `api.registerCli` registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

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

Reine npm-sichere Plugin-Spezifikationen werden während der Launch-Umstellung standardmäßig von npm installiert:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um die npm-only-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft vor der Installation die angekündigte Plugin-API-/Mindest-Gateway-Kompatibilität. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-Pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es dann über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den Legacy-Paketarchiv-Verifizierungspfad installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Updates.
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
    - ein Claude-Name eines bekannten Marketplace aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marketplace-Stamm oder ein `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzschreibweise wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Regeln für Remote-Marketplaces">
    Bei Remote-Marketplaces, die aus GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repo und weist HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten zurück.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden im normalen Plugin-Stamm installiert und nehmen am selben Ablauf für Auflisten/Info/Aktivieren/Deaktivieren teil. Heute werden Bundle-Skills, Claude-Command-Skills, Standardwerte aus Claude-`settings.json`, Standardwerte aus Claude-`.lsp.json` / per Manifest deklarierte `lspServers`, Cursor-Command-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnose/Info angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.
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
`plugins list` liest zuerst die dauerhaft gespeicherte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Kaltstartplanung sichtbar ist, ist aber keine Live-Laufzeitprüfung eines bereits laufenden Gateway-Prozesses. Starten Sie nach Änderungen an Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` das Gateway neu, das den Kanal bereitstellt, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Stellen Sie bei Remote-/Container-Bereitstellungen sicher, dass Sie den tatsächlichen untergeordneten `openclaw gateway run`-Prozess neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält für jedes Plugin dessen `dependencyStatus` aus `package.json`
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen entlang des normalen Node-`node_modules`-Suchpfads des Plugins vorhanden sind; es importiert keinen Plugin-Laufzeitcode, führt keinen Paketmanager aus und repariert keine fehlenden Abhängigkeiten.
</Note>

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Es prüft keinen lokalen
Status, verändert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Laufzeitcode. Suchergebnisse enthalten den ClawHub-Paketnamen, die Familie, den Kanal, die Version, eine Zusammenfassung und
einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das Plugin-Quellverzeichnis
über den passenden paketierten Quellpfad ein, z. B.
`/app/extensions/synology-chat`. OpenClaw erkennt dieses eingehängte Quell-Overlay
vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quellverzeichnis
bleibt inaktiv, sodass normale paketierte Installationen weiterhin das kompilierte Dist verwenden.

Für das Debugging von Laufzeit-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Die Laufzeitinspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um veralteten Abhängigkeitszustand zu bereinigen oder fehlende konfigurierte herunterladbare Plugins zu installieren.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Dienst-/Prozesshinweise, den Konfigurationspfad und die RPC-Funktionsfähigkeit.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, anstatt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinell verwalteter Zustand, keine Benutzerkonfiguration. Installationen und Aktualisierungen schreiben sie in `plugins/installs.json` unter dem aktiven OpenClaw-Zustandsverzeichnis. Die oberste `installRecords`-Map ist die dauerhafte Quelle der Installationsmetadaten, einschließlich Einträgen für defekte oder fehlende Plugin-Manifeste. Das `plugins`-Array ist der aus Manifesten abgeleitete Kalt-Registry-Cache. Die Datei enthält eine Warnung, sie nicht zu bearbeiten, und wird von `openclaw plugins update`, Deinstallation, Diagnosen und der Kalt-Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte veraltete `plugins.installs`-Einträge in der Konfiguration sieht, verschiebt es sie in den Plugin-Index und entfernt den Konfigurationsschlüssel; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationseinträge erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, dem dauerhaft gespeicherten Plugin-Index, den Allow-/Deny-List-Einträgen für Plugins und, falls zutreffend, verknüpften `plugins.load.paths`-Einträgen. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb des Plugin-Erweiterungsstamms von OpenClaw befindet. Bei Active-Memory-Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

<Note>
`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.
</Note>

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualisierungen gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und nachverfolgte Hook-Pack-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-ID gegenüber npm-Spezifikation auflösen">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die für dieses Plugin aufgezeichnete Installationsspezifikation wieder. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt gepinnte Versionen auch bei späteren `update <id>`-Läufen weiter verwendet werden.

    Für npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen wieder auf den nachverfolgten Plugin-Eintrag auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige ID-basierte Aktualisierungen auf.

    Wenn Sie den npm-Paketnamen ohne Version oder Tag übergeben, wird er ebenfalls wieder auf den nachverfolgten Plugin-Eintrag aufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version gepinnt war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Beta-Kanal-Aktualisierungen">
    `openclaw plugins update` verwendet die nachverfolgte Plugin-Spezifikation wieder, sofern Sie keine neue Spezifikation übergeben. `openclaw update` kennt zusätzlich den aktiven OpenClaw-Aktualisierungskanal: Auf dem Beta-Kanal versuchen npm- und ClawHub-Plugin-Einträge der Standardlinie zuerst `@beta` und fallen dann auf die aufgezeichnete Standard-/Latest-Spezifikation zurück, wenn kein Plugin-Beta-Release existiert. Exakte Versionen und explizite Tags bleiben an diesen Selektor gepinnt.

  </Accordion>
  <Accordion title="Versionsprüfungen und Integritätsabweichungen">
    Vor einer Live-npm-Aktualisierung prüft OpenClaw die installierte Paketversion anhand der npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird die Aktualisierung übersprungen, ohne etwas herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefaktabweichung. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach Bestätigung. Nicht interaktive Aktualisierungshelfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bei update">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Notfall-Override für falsch positive Treffer des integrierten Dangerous-Code-Scans während Plugin-Aktualisierungen verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtliniensperren oder Sperren aufgrund von Scan-Fehlern und gilt nur für Plugin-Aktualisierungen, nicht für Hook-Pack-Aktualisierungen.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt Identität, Ladestatus, Quelle, Manifest-Fähigkeiten, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und jede erkannte MCP- oder LSP-Serverunterstützung an, ohne standardmäßig Plugin-Laufzeit zu importieren. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzubeziehen. Die Laufzeitinspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden als Root-`openclaw`-Befehlsgruppen installiert. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` anzeigt, führen Sie ihn als `openclaw <command> ...` aus; zum Beispiel kann ein Plugin, das `demo-git` registriert, mit `openclaw demo-git ping` verifiziert werden.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Audits eignet. `inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Fähigkeitsarten, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und Kompatibilitätshinweise. Wenn alles sauber ist, gibt es `No plugin issues detected.` aus.

Wenn ein konfiguriertes Plugin auf der Festplatte vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorangehende Diagnose zum blockierten Plugin, etwa Pfadbesitz oder weltweit schreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exporten führen Sie den Befehl mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` erneut aus, um eine kompakte Zusammenfassung der Exportform in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist OpenClaws dauerhaft gespeichertes Kalt-Lesemodell für installierte Plugin-Identität, Aktivierung, Quellenmetadaten und Verantwortlichkeit für Beiträge. Normaler Start, Provider-Owner-Lookup, Klassifizierung des Kanal-Setups und Plugin-Inventar können sie lesen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und den Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Pfad zur Laufzeitaktivierung.

`openclaw doctor --fix` repariert außerdem Registry-nahe Abweichungen bei verwaltetem npm: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Paket unter dem verwalteten Plugin-npm-Root ein gebündeltes Plugin überschattet, entfernt doctor dieses veraltete Paket und baut die Registry neu auf, damit der Start gegen das gebündelte Manifest validiert.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Notfall-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfall-Wiederherstellung beim Start vorgesehen, während die Migration ausgerollt wird.
</Warning>

### Marktplatz

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Die Marktplatzliste akzeptiert einen lokalen Marktplatzpfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt das aufgelöste Quelllabel sowie das geparste Marktplatzmanifest und die Plugin-Einträge aus.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [Community-Plugins](/de/plugins/community)
