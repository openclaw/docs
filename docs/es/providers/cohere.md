---
read_when:
    - Quieres usar Cohere con OpenClaw
    - Necesitas la variable de entorno de la clave de API de Cohere o la opción de autenticación de la CLI
summary: Configuración de Cohere (autenticación + selección de modelo)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T12:35:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) proporciona inferencia compatible con OpenAI mediante su API de compatibilidad. OpenClaw incluye el proveedor Cohere durante su transición de externalización y también lo publica como plugin externo oficial con el catálogo de modelos Command A.

| Propiedad                 | Valor                                                    |
| ------------------------- | -------------------------------------------------------- |
| ID de proveedor           | `cohere`                                                 |
| Plugin                    | incluido durante la transición; paquete externo oficial  |
| Variable de entorno auth  | `COHERE_API_KEY`                                         |
| Marca de onboarding       | `--auth-choice cohere-api-key`                           |
| Marca directa de CLI      | `--cohere-api-key <key>`                                 |
| API                       | compatible con OpenAI (`openai-completions`)             |
| URL base                  | `https://api.cohere.ai/compatibility/v1`                 |
| Modelo predeterminado     | `cohere/command-a-03-2025`                               |

## Primeros pasos

1. Cohere está incluido en los paquetes actuales de OpenClaw. Si no está disponible, instala el paquete externo y reinicia el Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Crea una clave de API de Cohere.
3. Ejecuta el onboarding:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Confirma que el catálogo esté disponible:

```bash
openclaw models list --provider cohere
```

El modelo predeterminado se establece solo cuando no hay ningún modelo principal ya configurado.

## Configuración solo con entorno

Haz que `COHERE_API_KEY` esté disponible para el proceso del Gateway y luego selecciona el modelo de Cohere:

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
Si el Gateway se ejecuta como demonio o en Docker, configura `COHERE_API_KEY` para ese servicio. Exportarla solo en una shell interactiva no la deja disponible para un Gateway que ya está en ejecución.
</Note>

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [CLI de modelos](/es/cli/models)
- [Directorio de proveedores](/es/providers)
