---
read_when:
    - Probar flujos de incorporación o configuración con un plugin empaquetado localmente
    - Verificar un paquete de Plugin antes de publicarlo
    - Reemplazar una instalación automática de plugin por un artefacto de prueba
sidebarTitle: Install overrides
summary: Probar anulaciones de plugins empaquetados con flujos de instalación en tiempo de configuración
title: Sobrescrituras de instalación de Plugin
x-i18n:
    generated_at: "2026-06-27T12:12:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Las anulaciones de instalación de Plugins permiten a los mantenedores probar instalaciones de Plugins en tiempo de configuración contra
un paquete npm específico o un tarball local generado con npm-pack. Son solo para validación E2E y de paquetes.
Los usuarios normales deben instalar Plugins con
[`openclaw plugins install`](/es/cli/plugins).

<Warning>
Las anulaciones ejecutan código de Plugin desde la fuente que proporciones. Úsalas solo en un
directorio de estado aislado o en una máquina de pruebas desechable.
</Warning>

## Entorno

Las anulaciones están deshabilitadas a menos que ambas variables estén configuradas:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

El mapa de anulaciones es JSON con claves por id de Plugin. Los valores admiten:

- `npm:<registry-spec>` para paquetes del registro y versiones exactas o etiquetas
- `npm-pack:<path.tgz>` para tarballs locales producidos por `npm pack`

Las rutas relativas `npm-pack:` se resuelven desde el directorio de trabajo actual.

## Comportamiento

Cuando un flujo en tiempo de configuración solicita instalar un Plugin cuyo id aparece en el mapa,
OpenClaw usa la fuente de anulación en lugar del catálogo, la fuente incluida o la fuente
npm predeterminada. Esto se aplica al onboarding y a otros flujos que usan el instalador compartido
de Plugins en tiempo de configuración.

Las anulaciones siguen aplicando el id de Plugin esperado. Un tarball asignado a `codex`
debe instalar un Plugin cuyo id de manifiesto sea `codex`.

Las anulaciones no heredan el estado oficial de fuente confiable. Incluso cuando la entrada del catálogo
normalmente representa un paquete propiedad de OpenClaw, una anulación se trata como
entrada de prueba proporcionada por el operador.

Los archivos `.env` del espacio de trabajo no pueden habilitar anulaciones de instalación. Configura estas variables en
el shell confiable, el trabajo de CI o el comando de prueba remoto que inicia OpenClaw.

## E2E de paquetes

Usa un directorio de estado aislado para que las instalaciones de paquetes y los registros de instalación no
toquen tu estado normal de OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifica el paquete instalado bajo el directorio de estado:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Para E2E con proveedor en vivo, carga la clave de API real desde un shell confiable o un secreto de CI
antes de iniciar el comando de prueba. No imprimas claves; informa solo la fuente y
si la clave estaba presente.
