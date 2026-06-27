---
read_when:
    - Você está instalando, configurando ou auditando o Plugin microsoft-foundry
summary: Adiciona suporte ao provedor de modelos Microsoft Foundry ao OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T17:54:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Adiciona suporte ao provedor de modelos Microsoft Foundry ao OpenClaw.

## Distribuição

- Pacote: `@openclaw/microsoft-foundry`
- Rota de instalação: incluído no OpenClaw

## Superfície

provedores: microsoft-foundry; contratos: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Provedor de geração de imagens: `microsoft-foundry`

## Requisitos

- Um recurso Microsoft Foundry ou Azure AI Foundry com implantações.
- Autenticação por chave de API via `AZURE_OPENAI_API_KEY` ou uma chave de API de provedor configurada.
- Para autenticação com Entra ID, instale a Azure CLI e execute `az login` antes da
  integração inicial. O OpenClaw atualiza tokens de runtime do Microsoft Foundry por meio de
  `az account get-access-token`.

## Modelos de chat

Implantações de chat do Microsoft Foundry usam a referência de modelo do provedor
`microsoft-foundry/<deployment-name>`. A integração inicial descobre recursos
e implantações do Foundry com a Azure CLI e então grava o nome da implantação selecionada na
configuração do modelo.

O OpenClaw usa o endpoint `/openai/v1` do Foundry para APIs de chat compatíveis
com OpenAI que tenham suporte:

- As famílias de modelos GPT, `o*`, `computer-use-preview` e DeepSeek-V4 usam
  `openai-responses` por padrão.
- MAI-DS-R1 e outras implantações de conclusão de chat usam `openai-completions`
  a menos que uma API compatível explícita esteja configurada.
- MAI-DS-R1 é registrado como capaz de raciocínio por meio de conteúdo de raciocínio, não
  por meio de `reasoning_effort`. Seus metadados de tokens de contexto e saída são de
  163.840 tokens.

Implantações Anthropic Claude no Microsoft Foundry usam o formato da API Anthropic Messages,
não o formato compatível com OpenAI `/openai/v1`. Configure-as como um
provedor `anthropic-messages` personalizado até que o Plugin Microsoft Foundry ganhe um
runtime Anthropic nativo. Quando o nome da implantação Foundry diferir do ID do modelo
Claude, defina `params.canonicalModelId` na entrada do modelo para que o OpenClaw
possa aplicar contratos de transmissão específicos do modelo, mapear `/think off` corretamente e
preservar o raciocínio assinado com segurança.

## Geração de imagens MAI

O Plugin registra `microsoft-foundry` para `image_generate` com os modelos atuais
de imagem do Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Use um nome de implantação de imagem MAI implantada como referência do modelo. O provedor
não declara um modelo de imagem padrão porque a API MAI exige o nome da sua implantação
no campo `model` da solicitação:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

Chamadas de geração somente por prompt usam o endpoint de gerações MAI do Microsoft Foundry:
`/mai/v1/images/generations`. Edições com imagem de referência chamam
`/mai/v1/images/edits` e são limitadas às implantações `MAI-Image-2.5-Flash` e
`MAI-Image-2.5`.

A geração somente por prompt pode usar um nome de implantação personalizado com apenas o endpoint
Foundry configurado. Para edições de imagem com um nome de implantação personalizado, selecione a
implantação pela integração inicial ou inclua metadados do modelo para que o OpenClaw possa verificar
que a implantação é baseada em `MAI-Image-2.5-Flash` ou `MAI-Image-2.5`.

Restrições de imagem MAI:

- Saída: uma imagem PNG por solicitação.
- Tamanho: padrão `1024x1024`; tanto a largura quanto a altura devem ter pelo menos 768 px.
- Total de pixels: largura × altura deve ser no máximo 1.048.576.
- Edições: uma imagem de entrada PNG ou JPEG.
- Dicas compartilhadas sem suporte, como `aspectRatio`, `resolution`, `quality`,
  `background` e `outputFormat` não PNG, não são enviadas ao Microsoft Foundry.

## Solução de problemas

- `az: command not found`: instale a Azure CLI ou use autenticação por chave de API.
- `Microsoft Foundry endpoint missing for MAI image generation`: selecione uma
  implantação Foundry pela integração inicial ou adicione `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: o modelo de imagem selecionado aponta para uma
  implantação não MAI. Use um modelo de imagem MAI implantado para `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
