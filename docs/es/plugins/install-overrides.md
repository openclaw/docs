---
read_when:
    - Prueba de los flujos de incorporación o configuración con un plugin empaquetado localmente
    - Verificar un paquete de Plugin antes de publicarlo
    - Sustitución de la instalación automática de un plugin por un artefacto de prueba
sidebarTitle: Install overrides
summary: Probar las anulaciones de plugins empaquetados con flujos de instalación durante la configuración
title: Anulaciones de instalación de Plugins
x-i18n:
    generated_at: "2026-07-11T23:18:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Las anulaciones de instalación de Plugin permiten a los mantenedores hacer que las instalaciones de plugins durante la configuración usen un paquete npm específico o un tarball local generado por `npm pack`, en lugar de la fuente del catálogo, incluida o predeterminada de npm. Existen únicamente para pruebas E2E y validación de paquetes; los usuarios normales instalan plugins con
[`openclaw plugins install`](/es/cli/plugins).

<Warning>
Las anulaciones ejecutan código de Plugin desde la fuente que proporcione. Úselas únicamente en un directorio de estado aislado o en una máquina de pruebas desechable.
</Warning>

## Entorno

Las anulaciones están deshabilitadas a menos que se definan ambas variables:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

El mapa de anulaciones es un objeto JSON cuyas claves son identificadores de plugins. Los valores admiten:

| Prefijo               | Fuente                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm:<registry-spec>` | Paquetes del registro, versiones exactas o etiquetas                                                                 |
| `npm-pack:<path.tgz>` | Tarballs locales producidos por `npm pack`; las rutas relativas se resuelven desde el directorio de trabajo actual   |

## Comportamiento

Cuando un flujo de configuración instala un plugin cuyo identificador aparece en el mapa, OpenClaw usa la fuente de anulación en lugar de la fuente del catálogo, incluida o predeterminada de npm. Esto se aplica a la incorporación y a cualquier otro flujo que utilice el instalador compartido de plugins durante la configuración.

- Las anulaciones siguen exigiendo el identificador de plugin esperado: un tarball asignado a `codex` debe instalar un plugin cuyo identificador de manifiesto sea `codex`.
- Las anulaciones no heredan el estado oficial de fuente de confianza. Incluso cuando la entrada del catálogo representa normalmente un paquete propiedad de OpenClaw, una anulación se trata como entrada de prueba proporcionada por el operador.
- Los archivos `.env` del espacio de trabajo no pueden habilitar las anulaciones de instalación; ambas variables de entorno están en la lista de variables dotenv bloqueadas para el espacio de trabajo. Defínalas en el shell de confianza, el trabajo de CI o el comando de prueba remoto que inicia OpenClaw.

## E2E de paquetes

Use un directorio de estado aislado para que las instalaciones de paquetes y los registros de instalación no afecten al estado normal de OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifique el paquete instalado en el directorio de estado:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Para las pruebas E2E de proveedores en vivo, cargue la clave de API real desde un shell de confianza o un secreto de CI antes de iniciar el comando de prueba. No muestre las claves; indique únicamente la fuente y si la clave estaba presente.
