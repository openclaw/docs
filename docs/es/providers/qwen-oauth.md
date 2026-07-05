---
read_when:
    - Quieres configurar el id de proveedor qwen-oauth
    - Anteriormente usaste credenciales OAuth de Qwen Portal
    - Necesitas el endpoint de Qwen Portal o la guía de migración
summary: Usa el id de proveedor de Qwen Portal con OpenClaw
title: OAuth de Qwen / Portal
x-i18n:
    generated_at: "2026-07-05T11:41:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` es el id del proveedor Qwen Portal, registrado por el plugin Qwen
(`@openclaw/qwen-provider`). Apunta al endpoint de Qwen Portal en
`https://portal.qwen.ai/v1` y mantiene las configuraciones antiguas de Qwen OAuth
/ portal accesibles mediante un id de proveedor distinto, separado del proveedor
`qwen` canónico.

Elige `qwen-oauth` si ya tienes un token funcional de Qwen Portal, estás
migrando un flujo heredado de Qwen OAuth o Qwen CLI, o necesitas probar
específicamente el endpoint de Qwen Portal. Para configuraciones nuevas, prefiere
[Qwen](/es/providers/qwen) con el endpoint Standard ModelStudio: cubre
configuraciones nuevas con clave de API, opciones de endpoint más amplias,
Standard de pago por uso, Coding Plan y el catálogo completo del plugin Qwen.

## Configuración

Instala el plugin Qwen si aún no lo has hecho:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Proporciona tu token del portal mediante el onboarding:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Las ejecuciones no interactivas leen el token desde `--qwen-oauth-token <token>`, o establece:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

El onboarding almacena el token en un perfil de autenticación `qwen-oauth`,
inicializa el catálogo de modelos del portal y establece `qwen-oauth/qwen3.5-plus`
como modelo predeterminado cuando no hay ninguno configurado.

## Valores predeterminados

- Proveedor: `qwen-oauth`
- Alias: `qwen-portal`, `qwen-cli`
- URL base: `https://portal.qwen.ai/v1`
- Variable de entorno: `QWEN_API_KEY`
- Estilo de API: compatible con OpenAI
- Modelo predeterminado: `qwen-oauth/qwen3.5-plus`

## En qué se diferencia de Qwen

OpenClaw tiene dos ids de proveedor orientados a Qwen:

| Proveedor    | Familia de endpoints                                    | Ideal para                                                                                 |
| ------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `qwen`       | Endpoints de Qwen Cloud / Alibaba DashScope y Coding Plan | Configuraciones nuevas con clave de API, Standard de pago por uso, Coding Plan, funciones multimodales de DashScope |
| `qwen-oauth` | Endpoint de Qwen Portal en `portal.qwen.ai/v1`           | Tokens existentes de Qwen Portal y configuraciones heredadas de Qwen OAuth / CLI           |

Ambos proveedores usan formatos de solicitud compatibles con OpenAI, pero son
superficies de autenticación separadas. Un token almacenado para `qwen-oauth` no
debe tratarse como una clave de DashScope o ModelStudio, y una clave nueva de
DashScope debe usar el proveedor `qwen` canónico en su lugar.

## Modelos

El plugin Qwen inicializa este catálogo estático para el endpoint de Qwen Portal.
Todas las entradas usan una salida máxima de 65,536 tokens; la disponibilidad
depende de la cuenta y el token actuales de Qwen Portal.

| Ref. de modelo                   | Entrada       | Contexto  | Notas                 |
| --------------------------------- | ------------- | --------- | --------------------- |
| `qwen-oauth/qwen3.5-plus`         | texto, imagen | 1,000,000 | Modelo predeterminado |
| `qwen-oauth/qwen3.6-plus`         | texto, imagen | 1,000,000 |                       |
| `qwen-oauth/qwen3-max-2026-01-23` | texto         | 262,144   |                       |
| `qwen-oauth/qwen3-coder-next`     | texto         | 262,144   |                       |
| `qwen-oauth/qwen3-coder-plus`     | texto         | 1,000,000 |                       |
| `qwen-oauth/MiniMax-M2.5`         | texto         | 1,000,000 | Razonamiento          |
| `qwen-oauth/glm-5`                | texto         | 202,752   |                       |
| `qwen-oauth/glm-4.7`              | texto         | 202,752   |                       |
| `qwen-oauth/kimi-k2.5`            | texto, imagen | 262,144   |                       |

Si tu cuenta usa claves de API de ModelStudio / DashScope en su lugar, configura
el proveedor `qwen` canónico:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migración

Los perfiles heredados de Qwen Portal OAuth no se pueden actualizar; `openclaw doctor`
los marca. Si un perfil del portal deja de funcionar, vuelve a ejecutar el
onboarding con un token actual o cambia al proveedor Qwen Standard:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard global ModelStudio usa:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Solución de problemas

- Fallos de actualización de Portal OAuth: los perfiles heredados de Qwen Portal
  OAuth no se pueden actualizar. Vuelve a ejecutar el onboarding con un token actual.
- Errores de endpoint incorrecto: confirma que la ref. de modelo empieza por
  `qwen-oauth/` al usar un token del portal. Usa refs. `qwen/` solo para el
  proveedor Qwen canónico.
- Confusión con `QWEN_API_KEY`: ambas páginas de Qwen mencionan esta variable de
  entorno, pero el onboarding almacena las credenciales bajo el id de proveedor
  seleccionado. Prefiere el onboarding cuando mantengas `qwen` y `qwen-oauth`
  disponibles en la misma máquina.

## Relacionado

- [Qwen](/es/providers/qwen)
- [Alibaba Model Studio](/es/providers/alibaba)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)
