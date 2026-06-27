---
read_when:
    - Quieres configurar el id del proveedor qwen-oauth
    - Usaste anteriormente credenciales de OAuth de Qwen Portal
    - Necesitas el endpoint de Qwen Portal o instrucciones de migración
summary: Usa el id de proveedor de Qwen Portal con OpenClaw
title: Qwen OAuth / Portal
x-i18n:
    generated_at: "2026-06-27T12:43:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` es el id de proveedor de Qwen Portal. Apunta al endpoint de Qwen Portal
y mantiene las configuraciones antiguas de Qwen OAuth / portal accesibles mediante un
id de proveedor distinto.

Usa este proveedor cuando tengas específicamente un token actual de Qwen Portal para
`https://portal.qwen.ai/v1`, o cuando estés migrando una configuración antigua de
Qwen Portal / Qwen CLI y quieras mantener esas credenciales separadas del proveedor
canónico de Qwen Cloud. No es la primera opción recomendada para nuevos usuarios de Qwen.

Para nuevas configuraciones de Qwen Cloud, prefiere [Qwen](/es/providers/qwen) con el endpoint
Standard de ModelStudio, salvo que tengas específicamente un token actual de Qwen Portal.

## Configuración

Proporciona tu token del portal durante la incorporación:

```bash
openclaw onboard --auth-choice qwen-oauth
```

O define:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## Valores predeterminados

- Proveedor: `qwen-oauth`
- Alias: `qwen-portal`, `qwen-cli`
- URL base: `https://portal.qwen.ai/v1`
- Variable de entorno: `QWEN_API_KEY`
- Estilo de API: compatible con OpenAI
- Modelo predeterminado: `qwen-oauth/qwen3.5-plus`

## En qué se diferencia de Qwen

OpenClaw tiene dos ids de proveedor orientados a Qwen:

| Proveedor    | Familia de endpoints                                      | Ideal para                                                                                 |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `qwen`       | Endpoints de Qwen Cloud / Alibaba DashScope y Coding Plan | Nuevas configuraciones con clave de API, Standard de pago por uso, Coding Plan, funciones multimodales de DashScope |
| `qwen-oauth` | Endpoint de Qwen Portal en `portal.qwen.ai/v1`            | Tokens existentes de Qwen Portal y configuraciones heredadas de Qwen OAuth / CLI           |

Ambos proveedores usan formatos de solicitud compatibles con OpenAI, pero son superficies
de autenticación separadas. Un token almacenado para `qwen-oauth` no debe tratarse como
una clave de DashScope o ModelStudio, y una nueva clave de DashScope debe usar en su lugar
el proveedor canónico `qwen`.

## Cuándo elegir Qwen OAuth / Portal

- Ya tienes un token funcional de Qwen Portal.
- Estás conservando un flujo de trabajo heredado de Qwen OAuth o Qwen CLI mientras migras al
  modelo de proveedores de OpenClaw.
- Necesitas probar específicamente la compatibilidad con el endpoint de Qwen Portal.

Elige [Qwen](/es/providers/qwen) para configuraciones nuevas, opciones de endpoint más amplias, Standard
ModelStudio, Coding Plan y el catálogo completo del Plugin de Qwen.

## Modelos

El catálogo del Plugin de Qwen inicializa el valor predeterminado de Qwen Portal:

- `qwen-oauth/qwen3.5-plus`

La disponibilidad depende de la cuenta y el token actuales de Qwen Portal. Si tu
cuenta usa claves de API de ModelStudio / DashScope en su lugar, configura el proveedor
canónico `qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migración

Es posible que los perfiles heredados de Qwen Portal OAuth no se puedan actualizar. Si un perfil del portal
deja de funcionar, vuelve a autenticarte con un token actual o cambia al proveedor Standard
de Qwen:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard global de ModelStudio usa:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Solución de problemas

- Errores de actualización de Portal OAuth: es posible que los perfiles heredados de Qwen Portal OAuth no se puedan
  actualizar. Vuelve a ejecutar la incorporación con un token actual.
- Errores de endpoint incorrecto: confirma que la referencia del modelo empiece por `qwen-oauth/` cuando
  uses un token del portal. Usa referencias `qwen/` solo para el proveedor canónico de Qwen.
- Confusión con `QWEN_API_KEY`: ambas páginas de Qwen mencionan esta variable de entorno, pero la incorporación
  almacena las credenciales bajo el id de proveedor seleccionado. Prefiere la incorporación cuando
  mantengas `qwen` y `qwen-oauth` disponibles en la misma máquina.

## Relacionado

- [Qwen](/es/providers/qwen)
- [Alibaba Model Studio](/es/providers/alibaba)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)
