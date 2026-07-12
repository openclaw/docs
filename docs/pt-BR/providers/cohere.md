---
read_when:
    - Você quer usar a Cohere com o OpenClaw
    - Você precisa da variável de ambiente da chave de API da Cohere ou da opção de autenticação da CLI
summary: Configuração do Cohere (autenticação + seleção de modelo)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T00:18:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) fornece inferência compatível com a OpenAI por meio de sua API de Compatibilidade. O OpenClaw inclui o provedor Cohere durante sua transição para um Plugin externo e também o publica como um Plugin externo oficial.

| Propriedade                 | Valor                                                      |
| --------------------------- | ---------------------------------------------------------- |
| ID do provedor              | `cohere`                                                   |
| Plugin                      | incluído durante a transição; pacote externo oficial       |
| Variável de ambiente de autenticação | `COHERE_API_KEY`                                 |
| Flag de integração inicial  | `--auth-choice cohere-api-key`                             |
| Flag direta da CLI          | `--cohere-api-key <key>`                                   |
| API                         | compatível com a OpenAI (`openai-completions`)             |
| URL base                    | `https://api.cohere.ai/compatibility/v1`                   |
| Modelo padrão               | `cohere/command-a-plus-05-2026`                            |
| Janela de contexto          | 128.000 tokens                                             |

## Catálogo integrado

| Referência do modelo                   | Entrada       | Contexto | Saída máxima | Observações                                                   |
| -------------------------------------- | ------------- | -------- | ------------ | ------------------------------------------------------------- |
| `cohere/command-a-plus-05-2026`        | texto, imagem | 128.000  | 64.000       | Padrão; principal modelo agêntico e de raciocínio             |
| `cohere/command-a-03-2025`             | texto         | 256.000  | 8.000        | Modelo Command A anterior                                    |
| `cohere/command-a-reasoning-08-2025`   | texto         | 256.000  | 32.000       | Raciocínio agêntico e uso de ferramentas                     |
| `cohere/command-a-vision-07-2025`      | texto, imagem | 128.000  | 8.000        | Visão e análise de documentos; sem uso de ferramentas        |
| `cohere/north-mini-code-1-0`           | texto, imagem | 256.000  | 64.000       | Programação agêntica; raciocínio; limites gratuitos          |

Os modelos Cohere com capacidade de raciocínio oferecem suporte a dois modos de raciocínio da API de Compatibilidade. O OpenClaw mapeia **desativado** para `none` e todos os níveis de pensamento ativados para `high`. O Command A Vision não oferece suporte ao uso de ferramentas, portanto o OpenClaw mantém as ferramentas do agente desativadas para esse modelo.

## Primeiros passos

1. A Cohere está incluída nos pacotes atuais do OpenClaw. Se estiver ausente, instale o pacote externo e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Crie uma chave de API da Cohere.
3. Execute a integração inicial:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Confirme se o catálogo está disponível:

```bash
openclaw models list --provider cohere
```

A integração inicial só define a Cohere como o modelo principal quando nenhum modelo principal já está configurado.

## Configuração somente por ambiente

Disponibilize `COHERE_API_KEY` para o processo do Gateway e selecione o modelo da Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Se o Gateway for executado como daemon ou no Docker, defina `COHERE_API_KEY` para esse serviço. Exportá-la apenas em um shell interativo não a disponibiliza para um Gateway que já esteja em execução.
</Note>

## Relacionados

- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [CLI de modelos](/pt-BR/cli/models)
- [Diretório de provedores](/pt-BR/providers/index)
