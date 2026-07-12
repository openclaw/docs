---
read_when:
    - Quieres usar Tencent hy3 con OpenClaw
    - Necesitas configurar la clave de API de TokenHub o TokenPlan
summary: Configuración de Tencent Cloud TokenHub y TokenPlan para hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-11T23:28:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Instala el Plugin oficial del proveedor de Tencent Cloud para acceder a Tencent Hy3 mediante dos endpoints —TokenHub (`tencent-tokenhub`) y TokenPlan (`tencent-tokenplan`)— usando una API compatible con OpenAI.

| Propiedad                              | Valor                                                 |
| -------------------------------------- | ----------------------------------------------------- |
| Identificadores de proveedor           | `tencent-tokenhub`, `tencent-tokenplan`               |
| Paquete                                | `@openclaw/tencent-provider`                          |
| Variable de entorno de autenticación de TokenHub  | `TOKENHUB_API_KEY`                          |
| Variable de entorno de autenticación de TokenPlan | `TOKENPLAN_API_KEY`                         |
| Opción de incorporación de TokenHub    | `--auth-choice tokenhub-api-key`                      |
| Opción de incorporación de TokenPlan   | `--auth-choice tokenplan-api-key`                     |
| Opción directa de CLI para TokenHub    | `--tokenhub-api-key <key>`                            |
| Opción directa de CLI para TokenPlan   | `--tokenplan-api-key <key>`                           |
| API                                    | Compatible con OpenAI (`openai-completions`)          |
| URL base de TokenHub                   | `https://tokenhub.tencentmaas.com/v1`                 |
| URL base global de TokenHub            | `https://tokenhub-intl.tencentmaas.com/v1` (sustitución) |
| URL base de TokenPlan                  | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Modelo predeterminado                  | `tencent-tokenhub/hy3`                                |

## Inicio rápido

<Steps>
  <Step title="Crear una clave de API de Tencent">
    Crea una clave de API para Tencent Cloud TokenHub y TokenPlan. Si eliges un ámbito de acceso limitado para la clave, incluye **hy3** (y **hy3 preview** si planeas usarlo en TokenHub) entre los modelos permitidos.
  </Step>
  <Step title="Ejecutar la incorporación">
    <CodeGroup>

```bash Incorporación de TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Opción directa de TokenHub
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Incorporación de TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash Opción directa de TokenPlan
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Solo variables de entorno
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verificar el modelo">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Configuración no interactiva

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
Se requiere `--accept-risk` junto con `--non-interactive`.
</Note>

## Catálogo integrado

| Referencia del modelo           | Nombre                 | Entrada | Contexto | Salida máxima | Notas                    |
| ------------------------------- | ---------------------- | ------- | -------- | ------------- | ------------------------ |
| `tencent-tokenhub/hy3-preview`  | hy3 preview (TokenHub) | texto   | 256,000  | 64,000        | razonamiento habilitado  |
| `tencent-tokenhub/hy3`          | hy3 (TokenHub)         | texto   | 256,000  | 64,000        | razonamiento habilitado  |
| `tencent-tokenplan/hy3`         | hy3 (TokenPlan)        | texto   | 256,000  | 64,000        | razonamiento habilitado  |

hy3 es el gran modelo de lenguaje MoE de Tencent Hunyuan para razonamiento, seguimiento de instrucciones con contexto largo, código y flujos de trabajo de agentes. Los ejemplos de Tencent compatibles con OpenAI usan `hy3` como identificador del modelo y admiten llamadas a herramientas estándar mediante finalizaciones de chat, además de `reasoning_effort`.

<Tip>
  El identificador del modelo es `hy3`. No lo confundas con los modelos `HY-3D-*` de Tencent, que son API de generación 3D y no el modelo de chat de OpenClaw configurado por este proveedor.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Sustitución del endpoint">
    El catálogo integrado de OpenClaw usa el endpoint `https://tokenhub.tencentmaas.com/v1` de Tencent Cloud. Sustitúyelo únicamente si tu cuenta o región de TokenHub requiere otro distinto:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Disponibilidad de las variables de entorno para el daemon">
    Si el Gateway se ejecuta como servicio administrado (launchd, systemd, Docker), `TOKENHUB_API_KEY` y `TOKENPLAN_API_KEY` deben estar visibles para ese proceso. Defínelas en `~/.openclaw/.env` o mediante `env.shellEnv` para que los entornos de ejecución de launchd, systemd o Docker puedan leerlas.

    <Warning>
      Las claves exportadas únicamente en un shell interactivo no son visibles para los procesos administrados del Gateway. Usa el archivo de variables de entorno o el punto de configuración para garantizar su disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes del proveedor.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Página del producto TokenHub de Tencent Cloud.
  </Card>
  <Card title="Ficha del modelo preliminar Hy3" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detalles y pruebas comparativas de la versión preliminar de Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
