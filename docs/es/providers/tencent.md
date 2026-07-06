---
read_when:
    - Quieres usar Tencent hy3 con OpenClaw
    - Se necesita la configuración de la clave de API de TokenHub o TokenPlan
summary: Configuración de Tencent Cloud TokenHub y TokenPlan para hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-06T10:52:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Instala el Plugin oficial del proveedor de Tencent Cloud para acceder a Tencent Hy3 a través de dos endpoints: TokenHub (`tencent-tokenhub`) y TokenPlan (`tencent-tokenplan`), usando una API compatible con OpenAI.

| Propiedad                         | Valor                                                 |
| --------------------------------- | ----------------------------------------------------- |
| Ids de proveedor                  | `tencent-tokenhub`, `tencent-tokenplan`               |
| Paquete                           | `@openclaw/tencent-provider`                          |
| Variable de entorno auth TokenHub | `TOKENHUB_API_KEY`                                    |
| Variable de entorno auth TokenPlan | `TOKENPLAN_API_KEY`                                  |
| Flag de configuración inicial de TokenHub | `--auth-choice tokenhub-api-key`              |
| Flag de configuración inicial de TokenPlan | `--auth-choice tokenplan-api-key`             |
| Flag CLI directo de TokenHub      | `--tokenhub-api-key <key>`                            |
| Flag CLI directo de TokenPlan     | `--tokenplan-api-key <key>`                           |
| API                               | Compatible con OpenAI (`openai-completions`)          |
| URL base de TokenHub              | `https://tokenhub.tencentmaas.com/v1`                 |
| URL base global de TokenHub       | `https://tokenhub-intl.tencentmaas.com/v1` (sobrescritura) |
| URL base de TokenPlan             | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Modelo predeterminado             | `tencent-tokenhub/hy3`                                |

## Inicio rápido

<Steps>
  <Step title="Crear una clave de API de Tencent">
    Crea una clave de API para Tencent Cloud TokenHub y TokenPlan. Si eliges un alcance de acceso limitado para la clave, incluye **hy3** (y **hy3 preview** si planeas usarlo en TokenHub) en los modelos permitidos.
  </Step>
  <Step title="Ejecutar la configuración inicial">
    <CodeGroup>

```bash Configuración inicial de TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Flag directo de TokenHub
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Configuración inicial de TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash Flag directo de TokenPlan
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Solo entorno
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
`--accept-risk` es obligatorio junto con `--non-interactive`.
</Note>

## Catálogo integrado

| Ref. del modelo                  | Nombre                 | Entrada | Contexto | Salida máxima | Notas                    |
| -------------------------------- | ---------------------- | ------- | -------- | ------------- | ------------------------ |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | texto   | 256,000  | 64,000        | razonamiento habilitado |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | texto   | 256,000  | 64,000        | razonamiento habilitado |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | texto   | 256,000  | 64,000        | razonamiento habilitado |

hy3 es el modelo de lenguaje MoE grande de Tencent Hunyuan para razonamiento, seguimiento de instrucciones con contexto largo, código y flujos de trabajo de agentes. Los ejemplos compatibles con OpenAI de Tencent usan `hy3` como id de modelo y admiten llamadas a herramientas estándar de chat completions, además de `reasoning_effort`.

<Tip>
  El id de modelo es `hy3`. No lo confundas con los modelos `HY-3D-*` de Tencent, que son API de generación 3D y no son el modelo de chat de OpenClaw configurado por este proveedor.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Sobrescritura del endpoint">
    El catálogo integrado de OpenClaw usa el endpoint `https://tokenhub.tencentmaas.com/v1` de Tencent Cloud. Sobrescríbelo solo si tu cuenta o región de TokenHub requiere uno diferente:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Disponibilidad del entorno para el daemon">
    Si el Gateway se ejecuta como un servicio gestionado (launchd, systemd, Docker), `TOKENHUB_API_KEY` y `TOKENPLAN_API_KEY` deben ser visibles para ese proceso. Defínelos en `~/.openclaw/.env` o mediante `env.shellEnv` para que los entornos de launchd, systemd o Docker exec puedan leerlos.

    <Warning>
      Las claves exportadas solo en un shell interactivo no son visibles para los procesos gestionados del gateway. Usa el archivo env o la vía de configuración para disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, refs. de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes de proveedores.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Página de producto TokenHub de Tencent Cloud.
  </Card>
  <Card title="Ficha del modelo Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detalles y benchmarks de Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
