---
read_when:
    - Onboarding- oder Einrichtungsabläufe gegen ein lokal gepacktes Plugin testen
    - Ein Plugin-Paket vor der Veröffentlichung verifizieren
    - Automatische Plugin-Installation durch ein Testartefakt ersetzen
sidebarTitle: Install overrides
summary: Testen paketierter Plugin-Overrides mit Installationsabläufen zur Einrichtungszeit
title: Plugin-Installationsüberschreibungen
x-i18n:
    generated_at: "2026-06-27T17:48:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Overrides für Plugin-Installationen ermöglichen Maintainern, Plugin-Installationen zur Einrichtungszeit gegen ein bestimmtes npm-Paket oder einen lokalen `npm-pack`-Tarball zu testen. Sie sind ausschließlich für E2E- und Paketvalidierung vorgesehen. Reguläre Benutzer sollten Plugins mit [`openclaw plugins install`](/de/cli/plugins) installieren.

<Warning>
Overrides führen Plugin-Code aus der von Ihnen bereitgestellten Quelle aus. Verwenden Sie sie nur in einem isolierten Zustandsverzeichnis oder auf einer wegwerfbaren Testmaschine.
</Warning>

## Umgebung

Overrides sind deaktiviert, sofern nicht beide Variablen gesetzt sind:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Die Override-Zuordnung ist JSON, nach Plugin-ID indiziert. Werte unterstützen:

- `npm:<registry-spec>` für Registry-Pakete und exakte Versionen oder Tags
- `npm-pack:<path.tgz>` für lokale Tarballs, die mit `npm pack` erzeugt wurden

Relative `npm-pack:`-Pfade werden vom aktuellen Arbeitsverzeichnis aus aufgelöst.

## Verhalten

Wenn ein Flow zur Einrichtungszeit die Installation eines Plugins anfordert, dessen ID in der Zuordnung vorkommt, verwendet OpenClaw die Override-Quelle anstelle der Katalog-, gebündelten oder standardmäßigen npm-Quelle. Dies gilt für Onboarding und andere Flows, die den gemeinsam genutzten Plugin-Installer zur Einrichtungszeit verwenden.

Overrides erzwingen weiterhin die erwartete Plugin-ID. Ein Tarball, der `codex` zugeordnet ist, muss ein Plugin installieren, dessen Manifest-ID `codex` ist.

Overrides erben nicht den offiziellen Status als vertrauenswürdige Quelle. Selbst wenn der Katalogeintrag normalerweise ein OpenClaw-eigenes Paket darstellt, wird ein Override als vom Betreiber bereitgestellte Testeingabe behandelt.

Workspace-`.env`-Dateien können Installations-Overrides nicht aktivieren. Setzen Sie diese Variablen in der vertrauenswürdigen Shell, im CI-Job oder im Remote-Testbefehl, der OpenClaw startet.

## Paket-E2E

Verwenden Sie ein isoliertes Zustandsverzeichnis, damit Paketinstallationen und Installationsdatensätze Ihren normalen OpenClaw-Zustand nicht berühren:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Überprüfen Sie das installierte Paket unter dem Zustandsverzeichnis:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Für Live-Provider-E2E beziehen Sie den echten API-Schlüssel aus einer vertrauenswürdigen Shell oder einem CI-Secret, bevor Sie den Testbefehl starten. Geben Sie Schlüssel nicht aus; berichten Sie nur die Quelle und ob der Schlüssel vorhanden war.
