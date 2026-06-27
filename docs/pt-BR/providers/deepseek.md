---
read_when:
    - Você quer usar o DeepSeek com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do DeepSeek (autenticação + seleção de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:03:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) fornece modelos de IA poderosos com uma API compatível com OpenAI.

| Propriedade | Valor                      |
| -------- | -------------------------- |
| Provedor | `deepseek`                 |
| Autenticação     | `DEEPSEEK_API_KEY`         |
| API      | compatível com OpenAI          |
| URL base | `https://api.deepseek.com` |

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Get your API key">
    Crie uma chave de API em [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Isso solicitará sua chave de API e definirá `deepseek/deepseek-v4-flash` como o modelo padrão.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Para inspecionar o catálogo estático do Plugin sem exigir um Gateway em execução,
    use:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    Para instalações com script ou sem interface gráfica, passe todas as flags diretamente:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Se o Gateway for executado como daemon (launchd/systemd), garanta que `DEEPSEEK_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Ref. do modelo                    | Nome              | Entrada | Contexto   | Saída máxima | Observações                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | texto  | 1,000,000 | 384,000    | Modelo padrão; superfície V4 compatível com thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | texto  | 1,000,000 | 384,000    | Superfície V4 compatível com thinking                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texto  | 131,072   | 8,192      | Superfície DeepSeek V3.2 sem thinking         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texto  | 131,072   | 65,536     | Superfície V3.2 com raciocínio habilitado             |

<Tip>
Modelos V4 oferecem suporte ao controle `thinking` da DeepSeek. O OpenClaw também reproduz
o `reasoning_content` da DeepSeek em turnos de acompanhamento para que sessões de thinking com chamadas de ferramentas
possam continuar.
Use `/think xhigh` ou `/think max` com modelos DeepSeek V4 para solicitar o
`reasoning_effort` máximo da DeepSeek.
</Tip>

## Thinking e ferramentas

Sessões de thinking do DeepSeek V4 têm um contrato de reprodução mais rigoroso do que a maioria dos
provedores compatíveis com OpenAI: depois que um turno com thinking habilitado usa ferramentas, a DeepSeek
espera que as mensagens de assistente reproduzidas desse turno incluam
`reasoning_content` em solicitações de acompanhamento. O OpenClaw trata isso dentro do
Plugin DeepSeek, então o uso normal de ferramentas em vários turnos funciona com
`deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`.

Se você alternar uma sessão existente de outro provedor compatível com OpenAI para um
modelo DeepSeek V4, turnos anteriores de chamadas de ferramenta do assistente talvez não tenham
`reasoning_content` nativo da DeepSeek. O OpenClaw preenche esse campo ausente em mensagens
de assistente reproduzidas para solicitações de thinking do DeepSeek V4, para que o provedor possa aceitar
o histórico sem exigir `/new`.

Quando o thinking está desabilitado no OpenClaw (incluindo a seleção **None** na UI),
o OpenClaw envia `thinking: { type: "disabled" }` à DeepSeek e remove
`reasoning_content` reproduzido do histórico de saída. Isso mantém sessões com thinking desabilitado
no caminho sem thinking da DeepSeek.

Use `deepseek/deepseek-v4-flash` para o caminho rápido padrão. Use
`deepseek/deepseek-v4-pro` quando quiser o modelo V4 mais forte e puder aceitar
maior custo ou latência.

## Testes ao vivo

A suíte direta de modelos ao vivo inclui DeepSeek V4 no conjunto de modelos moderno. Para
executar apenas as verificações diretas de modelo do DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Essa verificação ao vivo valida que ambos os modelos V4 conseguem concluir e que turnos de acompanhamento
com thinking/ferramentas preservam o payload de reprodução exigido pela DeepSeek.

## Exemplo de configuração

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Relacionados

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
