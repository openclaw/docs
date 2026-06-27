---
read_when:
    - Você quer usar a Cohere com o OpenClaw
    - Você precisa da variável de ambiente da chave de API da Cohere ou da escolha de autenticação da CLI
summary: Configuração da Cohere (autenticação + seleção de modelo)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:02:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) fornece inferência compatível com OpenAI por meio de sua API de compatibilidade. O OpenClaw distribui o provedor Cohere durante sua transição de externalização e também o publica como um Plugin externo oficial com o catálogo de modelos Command A.

| Propriedade                         | Valor                                               |
| ----------------------------------- | --------------------------------------------------- |
| ID do provedor                      | `cohere`                                            |
| Plugin                              | incluído durante a transição; pacote externo oficial |
| Variável de ambiente de autenticação | `COHERE_API_KEY`                                    |
| Flag de onboarding                  | `--auth-choice cohere-api-key`                      |
| Flag direta da CLI                  | `--cohere-api-key <key>`                            |
| API                                 | compatível com OpenAI (`openai-completions`)        |
| URL base                            | `https://api.cohere.ai/compatibility/v1`            |
| Modelo padrão                       | `cohere/command-a-03-2025`                          |

## Comece

1. O Cohere está incluído nos pacotes atuais do OpenClaw. Se ele não estiver disponível, instale o pacote externo e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Crie uma chave de API da Cohere.
3. Execute o onboarding:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Confirme que o catálogo está disponível:

```bash
openclaw models list --provider cohere
```

O modelo padrão é definido somente quando nenhum modelo primário já está configurado.

## Configuração somente por ambiente

Disponibilize `COHERE_API_KEY` para o processo do Gateway e então selecione o modelo Cohere:

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
Se o Gateway for executado como um daemon ou no Docker, configure `COHERE_API_KEY` para esse serviço. Exportá-la apenas em um shell interativo não a disponibiliza para um Gateway que já está em execução.
</Note>

## Relacionado

- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [CLI de modelos](/pt-BR/cli/models)
- [Diretório de provedores](/pt-BR/providers)
