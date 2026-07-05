---
read_when:
    - Quieres usar Cohere con OpenClaw
    - Necesitas la variable de entorno de clave de API de Cohere o la opción de autenticación de la CLI
summary: Configuración de Cohere (autenticación + selección de modelo)
title: Cohere
x-i18n:
    generated_at: "2026-07-05T11:39:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 846e69fd185c210c9ffd8719a233272aeda2aa0749f952a74714c13fd917fb66
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) proporciona inferencia compatible con OpenAI mediante su API de compatibilidad. OpenClaw incluye el proveedor Cohere durante su transición de externalización y también lo publica como Plugin externo oficial.

| Propiedad                | Valor                                                    |
| ------------------------ | -------------------------------------------------------- |
| ID del proveedor         | `cohere`                                                 |
| Plugin                   | incluido durante la transición; paquete externo oficial  |
| Variable de entorno auth | `COHERE_API_KEY`                                         |
| Opción de incorporación  | `--auth-choice cohere-api-key`                           |
| Opción directa de CLI    | `--cohere-api-key <key>`                                 |
| API                      | compatible con OpenAI (`openai-completions`)             |
| URL base                 | `https://api.cohere.ai/compatibility/v1`                 |
| Modelo predeterminado    | `cohere/command-a-03-2025`                               |
| Ventana de contexto      | 256 000 tokens                                           |

## Primeros pasos

1. Cohere se incluye con los paquetes actuales de OpenClaw. Si falta, instala el paquete externo y reinicia el Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Crea una clave de API de Cohere.
3. Ejecuta la incorporación:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Confirma que el catálogo esté disponible:

```bash
openclaw models list --provider cohere
```

La incorporación solo establece Cohere como modelo principal cuando todavía no hay ningún modelo principal configurado.

## Configuración solo con entorno

Haz que `COHERE_API_KEY` esté disponible para el proceso del Gateway y, luego, selecciona el modelo de Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Si el Gateway se ejecuta como daemon o en Docker, configura `COHERE_API_KEY` para ese servicio. Exportarla solo en un shell interactivo no la pone a disposición de un Gateway que ya se está ejecutando.
</Note>

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [CLI de modelos](/es/cli/models)
- [Directorio de proveedores](/es/providers/index)
