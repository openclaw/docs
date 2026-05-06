---
read_when:
    - Quieres modelos GLM en OpenClaw
    - Necesitas la convención de nomenclatura y la configuración del modelo
summary: Descripción general de la familia de modelos GLM y cómo usarla en OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T05:45:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM es una familia de modelos (no una empresa) disponible a través de la plataforma [Z.AI](https://z.ai). En OpenClaw, se accede a los modelos GLM mediante el proveedor `zai` incluido, con referencias como `zai/glm-5.1`.

| Propiedad              | Valor                                                                       |
| ---------------------- | --------------------------------------------------------------------------- |
| Id. de proveedor       | `zai`                                                                       |
| Plugin                 | incluido, `enabledByDefault: true`                                          |
| Variables env de auth  | `ZAI_API_KEY` o `Z_AI_API_KEY`                                              |
| Opciones de onboarding | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                    | compatible con OpenAI                                                       |
| URL base predeterminada | `https://api.z.ai/api/paas/v4`                                             |
| Valor predeterminado sugerido | `zai/glm-5.1`                                                        |
| Modelo de imagen predeterminado | `zai/glm-4.6v`                                                     |

## Primeros pasos

<Steps>
  <Step title="Elige una ruta de autenticación y ejecuta el onboarding">
    Elige la opción de onboarding que coincida con tu plan y región de Z.AI. La opción genérica `zai-api-key` detecta automáticamente el endpoint correspondiente a partir de la forma de la clave; usa las opciones regionales explícitas cuando quieras forzar un Coding Plan específico o una superficie de API general.

    | Opción de auth       | Mejor para                                         |
    | -------------------- | -------------------------------------------------- |
    | `zai-api-key`        | Clave de API genérica con detección automática de endpoint |
    | `zai-coding-global`  | Usuarios de Coding Plan (global)                  |
    | `zai-coding-cn`      | Usuarios de Coding Plan (región de China)         |
    | `zai-global`         | API general (global)                              |
    | `zai-cn`             | API general (región de China)                     |

    <CodeGroup>

```bash Detección automática
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash API general (global)
openclaw onboard --auth-choice zai-global
```

```bash API general (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="Establece GLM como modelo predeterminado">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verifica que los modelos estén disponibles">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Ejemplo de configuración

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  `zai-api-key` permite que OpenClaw detecte el endpoint de Z.AI correspondiente a partir de la forma de la clave y aplique automáticamente la URL base correcta. Usa las opciones regionales explícitas cuando quieras fijar un Coding Plan específico o una superficie de API general.
</Tip>

## Catálogo integrado

El proveedor `zai` incluido inicializa 13 referencias de modelos GLM. Todas las entradas admiten razonamiento salvo que se indique lo contrario; `glm-5v-turbo` y `glm-4.6v` aceptan entrada de imagen además de texto.

| Referencia de modelo  | Notas                                              |
| --------------------- | -------------------------------------------------- |
| `zai/glm-5.1`         | Modelo predeterminado. Razonamiento, solo texto, contexto de 202k. |
| `zai/glm-5`           | Razonamiento, solo texto, contexto de 202k.        |
| `zai/glm-5-turbo`     | Razonamiento, solo texto, contexto de 202k.        |
| `zai/glm-5v-turbo`    | Razonamiento, texto + imagen, contexto de 202k.    |
| `zai/glm-4.7`         | Razonamiento, solo texto, contexto de 204k.        |
| `zai/glm-4.7-flash`   | Razonamiento, solo texto, contexto de 200k.        |
| `zai/glm-4.7-flashx`  | Razonamiento, solo texto.                          |
| `zai/glm-4.6`         | Razonamiento, solo texto.                          |
| `zai/glm-4.6v`        | Razonamiento, texto + imagen. Modelo de imagen predeterminado. |
| `zai/glm-4.5`         | Razonamiento, solo texto.                          |
| `zai/glm-4.5-air`     | Razonamiento, solo texto.                          |
| `zai/glm-4.5-flash`   | Razonamiento, solo texto.                          |
| `zai/glm-4.5v`        | Razonamiento, texto + imagen.                      |

<Note>
  Las versiones y la disponibilidad de GLM pueden cambiar. Ejecuta `openclaw models list --provider zai` para ver las filas del catálogo conocidas por tu versión instalada, y consulta la documentación de Z.AI para ver modelos recién añadidos o en desuso.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Detección automática de endpoint">
    Cuando usas la opción de auth `zai-api-key`, OpenClaw inspecciona la forma de la clave para determinar la URL base correcta de Z.AI. Las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) anulan la detección automática y fijan directamente el endpoint.
  </Accordion>

  <Accordion title="Detalles del proveedor">
    Los modelos GLM se sirven mediante el proveedor de runtime `zai`. Para ver la configuración completa del proveedor, los endpoints regionales y capacidades adicionales, consulta la [página del proveedor Z.AI](/es/providers/zai).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedor Z.AI" href="/es/providers/zai" icon="server">
    Configuración completa del proveedor Z.AI y endpoints regionales.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Modos de razonamiento" href="/es/tools/thinking" icon="brain">
    Niveles de `/think` para la familia GLM con capacidad de razonamiento.
  </Card>
  <Card title="FAQ de modelos" href="/es/help/faq-models" icon="circle-question">
    Perfiles de auth, cambio de modelos y resolución de errores de "sin perfil".
  </Card>
</CardGroup>
