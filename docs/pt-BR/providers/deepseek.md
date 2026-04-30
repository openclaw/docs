---
read_when:
    - Você quer usar o DeepSeek com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do DeepSeek (autenticação + seleção de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T10:04:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) fornece modelos de IA poderosos com uma API compatível com OpenAI.

| Propriedade | Valor                      |
| -------- | -------------------------- |
| Provedor | `deepseek`                 |
| Autenticação     | `DEEPSEEK_API_KEY`         |
| API      | Compatível com OpenAI          |
| URL base | `https://api.deepseek.com` |

## Introdução

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API em [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Isso solicitará sua chave de API e definirá `deepseek/deepseek-v4-flash` como o modelo padrão.

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
    Para instalações com script ou sem interface, passe todas as flags diretamente:

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

| Ref do modelo                    | Nome              | Entrada | Contexto   | Saída máxima | Observações                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | Modelo padrão; superfície V4 com suporte a pensamento |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | Superfície V4 com suporte a pensamento                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | Superfície DeepSeek V3.2 sem pensamento         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | Superfície V3.2 com raciocínio habilitado             |

<Tip>
Os modelos V4 são compatíveis com o controle `thinking` do DeepSeek. O OpenClaw também reproduz
`reasoning_content` do DeepSeek em turnos seguintes para que sessões de pensamento com chamadas de ferramenta
possam continuar.
</Tip>

## Pensamento e ferramentas

Sessões de pensamento do DeepSeek V4 têm um contrato de reprodução mais rigoroso do que a maioria dos
provedores compatíveis com OpenAI: depois que um turno com pensamento habilitado usa ferramentas, o DeepSeek
espera que as mensagens de assistente reproduzidas desse turno incluam
`reasoning_content` em solicitações seguintes. O OpenClaw lida com isso dentro do
Plugin do DeepSeek, então o uso normal de ferramentas em múltiplos turnos funciona com
`deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`.

Se você alternar uma sessão existente de outro provedor compatível com OpenAI para um
modelo DeepSeek V4, turnos antigos de chamadas de ferramenta do assistente podem não ter
`reasoning_content` nativo do DeepSeek. O OpenClaw preenche esse campo ausente em mensagens de
assistente reproduzidas para solicitações de pensamento do DeepSeek V4, para que o provedor possa aceitar
o histórico sem exigir `/new`.

Quando o pensamento está desabilitado no OpenClaw (incluindo a seleção **Nenhum** da UI),
o OpenClaw envia `thinking: { type: "disabled" }` ao DeepSeek e remove
`reasoning_content` reproduzido do histórico de saída. Isso mantém as sessões com pensamento desabilitado
no caminho sem pensamento do DeepSeek.

Use `deepseek/deepseek-v4-flash` para o caminho rápido padrão. Use
`deepseek/deepseek-v4-pro` quando quiser o modelo V4 mais forte e puder aceitar
custo ou latência maiores.

## Testes ao vivo

A suíte direta de modelos ao vivo inclui DeepSeek V4 no conjunto de modelos moderno. Para
executar apenas as verificações diretas de modelo do DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Essa verificação ao vivo confirma que ambos os modelos V4 conseguem concluir e que os turnos seguintes de pensamento/ferramenta
preservam o payload de reprodução exigido pelo DeepSeek.

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
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
