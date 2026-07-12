---
read_when:
    - Quieres configurar el identificador de proveedor `qwen-oauth`
    - Anteriormente usaste credenciales de OAuth de Qwen Portal
    - Necesitas el endpoint de Qwen Portal o una guía de migración
summary: Usa el id de proveedor de Qwen Portal con OpenClaw
title: OAuth / Portal de Qwen
x-i18n:
    generated_at: "2026-07-11T23:30:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` es el id del proveedor de Qwen Portal, registrado por el Plugin de Qwen
(`@openclaw/qwen-provider`). Utiliza el endpoint de Qwen Portal en
`https://portal.qwen.ai/v1` y permite seguir accediendo a configuraciones
anteriores de Qwen OAuth o del portal mediante un id de proveedor distinto,
separado del proveedor canónico `qwen`.

Elija `qwen-oauth` si ya tiene un token de Qwen Portal que funciona, está
migrando un flujo de trabajo heredado de Qwen OAuth o Qwen CLI, o necesita
probar específicamente el endpoint de Qwen Portal. Para configuraciones nuevas,
prefiera [Qwen](/es/providers/qwen) con el endpoint estándar de ModelStudio:
admite nuevas configuraciones con clave de API, más opciones de endpoints,
el plan Standard de pago por uso, Coding Plan y el catálogo completo del
Plugin de Qwen.

## Configuración

Instale el Plugin de Qwen si aún no lo ha hecho:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Proporcione su token del portal durante la incorporación:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Las ejecuciones no interactivas leen el token de `--qwen-oauth-token <token>`, o bien configure:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

La incorporación almacena el token en un perfil de autenticación `qwen-oauth`,
inicializa el catálogo de modelos del portal y establece
`qwen-oauth/qwen3.5-plus` como modelo predeterminado cuando no hay ninguno
configurado.

## Valores predeterminados

- Proveedor: `qwen-oauth`
- Alias: `qwen-portal`, `qwen-cli`
- URL base: `https://portal.qwen.ai/v1`
- Variable de entorno: `QWEN_API_KEY`
- Estilo de API: compatible con OpenAI
- Modelo predeterminado: `qwen-oauth/qwen3.5-plus`

## Diferencias con Qwen

OpenClaw tiene dos ids de proveedor orientados a Qwen:

| Proveedor    | Familia de endpoints                                      | Recomendado para                                                                                              |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `qwen`       | Endpoints de Qwen Cloud / Alibaba DashScope y Coding Plan | Nuevas configuraciones con clave de API, Standard de pago por uso, Coding Plan y funciones multimodales de DashScope |
| `qwen-oauth` | Endpoint de Qwen Portal en `portal.qwen.ai/v1`            | Tokens existentes de Qwen Portal y configuraciones heredadas de Qwen OAuth / CLI                             |

Ambos proveedores usan formatos de solicitud compatibles con OpenAI, pero son
superficies de autenticación independientes. Un token almacenado para
`qwen-oauth` no debe tratarse como una clave de DashScope o ModelStudio, y una
clave nueva de DashScope debe usar en su lugar el proveedor canónico `qwen`.

## Modelos

El Plugin de Qwen inicializa este catálogo estático para el endpoint de Qwen
Portal. Todas las entradas permiten una salida máxima de 65 536 tokens; la
disponibilidad depende de la cuenta y el token actuales de Qwen Portal.

| Referencia del modelo             | Entrada       | Contexto  | Notas               |
| --------------------------------- | ------------- | --------- | ------------------- |
| `qwen-oauth/qwen3.5-plus`         | texto, imagen | 1 000 000 | Modelo predeterminado |
| `qwen-oauth/qwen3.6-plus`         | texto, imagen | 1 000 000 |                     |
| `qwen-oauth/qwen3-max-2026-01-23` | texto         | 262 144   |                     |
| `qwen-oauth/qwen3-coder-next`     | texto         | 262 144   |                     |
| `qwen-oauth/qwen3-coder-plus`     | texto         | 1 000 000 |                     |
| `qwen-oauth/MiniMax-M2.5`         | texto         | 1 000 000 | Razonamiento         |
| `qwen-oauth/glm-5`                | texto         | 202 752   |                     |
| `qwen-oauth/glm-4.7`              | texto         | 202 752   |                     |
| `qwen-oauth/kimi-k2.5`            | texto, imagen | 262 144   |                     |

Si su cuenta utiliza claves de API de ModelStudio / DashScope, configure en su
lugar el proveedor canónico `qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migración

Los perfiles OAuth heredados de Qwen Portal no se pueden renovar;
`openclaw doctor` los marca. Si un perfil del portal deja de funcionar, vuelva
a ejecutar la incorporación con un token actual o cambie al proveedor Standard
de Qwen:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

El servicio global Standard de ModelStudio utiliza:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Solución de problemas

- Errores de renovación de OAuth del portal: los perfiles OAuth heredados de
  Qwen Portal no se pueden renovar. Vuelva a ejecutar la incorporación con un
  token actual.
- Errores de endpoint incorrecto: confirme que la referencia del modelo
  comienza por `qwen-oauth/` cuando utilice un token del portal. Use referencias
  `qwen/` solo para el proveedor canónico de Qwen.
- Confusión con `QWEN_API_KEY`: ambas páginas de Qwen mencionan esta variable de
  entorno, pero la incorporación almacena las credenciales bajo el id del
  proveedor seleccionado. Prefiera la incorporación cuando mantenga disponibles
  tanto `qwen` como `qwen-oauth` en la misma máquina.

## Contenido relacionado

- [Qwen](/es/providers/qwen)
- [Alibaba Model Studio](/es/providers/alibaba)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)
