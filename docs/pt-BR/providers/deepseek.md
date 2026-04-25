---
read_when:
    - Você quer usar o DeepSeek com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do DeepSeek (autenticação + seleção de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:54:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) fornece modelos de IA poderosos com uma API compatível com OpenAI.

| Propriedade | Valor                      |
| ----------- | -------------------------- |
| Provedor    | `deepseek`                 |
| Autenticação | `DEEPSEEK_API_KEY`        |
| API         | compatível com OpenAI      |
| URL base    | `https://api.deepseek.com` |

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API em [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Execute a configuração inicial">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Isso solicitará sua chave de API e definirá `deepseek/deepseek-v4-flash` como modelo padrão.

  </Step>
  <Step title="Verifique se os modelos estão disponíveis">
    ```bash
    openclaw models list --provider deepseek
    ```

    Para inspecionar o catálogo estático incluído sem exigir um Gateway em execução,
    use:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuração não interativa">
    Para instalações automatizadas ou sem interface, passe todas as flags diretamente:

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
Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que `DEEPSEEK_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Ref. do modelo               | Nome              | Entrada | Contexto  | Saída máx. | Observações                                |
| ---------------------------- | ----------------- | ------- | --------- | ----------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000     | Modelo padrão; superfície V4 com capacidade de raciocínio |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000     | Superfície V4 com capacidade de raciocínio |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072   | 8,192       | Superfície sem raciocínio DeepSeek V3.2    |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072   | 65,536      | Superfície V3.2 com raciocínio habilitado  |

<Tip>
Os modelos V4 oferecem suporte ao controle `thinking` do DeepSeek. O OpenClaw também reproduz
o `reasoning_content` do DeepSeek em turnos de acompanhamento para que sessões de raciocínio com chamadas de ferramentas
possam continuar.
</Tip>

## Raciocínio e ferramentas

As sessões de raciocínio do DeepSeek V4 têm um contrato de reprodução mais rígido do que a maioria
dos provedores compatíveis com OpenAI: quando uma mensagem do assistente com raciocínio habilitado inclui
chamadas de ferramentas, o DeepSeek espera que o `reasoning_content` anterior do assistente seja enviado
novamente na solicitação de acompanhamento. O OpenClaw lida com isso dentro do Plugin do DeepSeek,
portanto o uso normal de ferramentas em vários turnos funciona com `deepseek/deepseek-v4-flash` e
`deepseek/deepseek-v4-pro`.

Se você alternar uma sessão existente de outro provedor compatível com OpenAI para um
modelo DeepSeek V4, turnos anteriores de chamada de ferramentas do assistente podem não ter
`reasoning_content` nativo do DeepSeek. O OpenClaw preenche esse campo ausente para solicitações de raciocínio
do DeepSeek V4 para que o provedor possa aceitar o histórico reproduzido de chamadas de ferramentas
sem exigir `/new`.

Quando o raciocínio está desabilitado no OpenClaw (incluindo a seleção **None** na UI),
o OpenClaw envia `thinking: { type: "disabled" }` do DeepSeek e remove o
`reasoning_content` reproduzido do histórico de saída. Isso mantém sessões com raciocínio desabilitado
no caminho sem raciocínio do DeepSeek.

Use `deepseek/deepseek-v4-flash` para o caminho rápido padrão. Use
`deepseek/deepseek-v4-pro` quando quiser o modelo V4 mais robusto e puder aceitar
custo ou latência mais altos.

## Testes ao vivo

A suíte direta de modelos ao vivo inclui o DeepSeek V4 no conjunto moderno de modelos. Para
executar apenas as verificações diretas do modelo DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Essa verificação ao vivo confirma que ambos os modelos V4 podem ser concluídos e que turnos de acompanhamento de raciocínio/ferramentas
preservam a carga de reprodução exigida pelo DeepSeek.

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

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
