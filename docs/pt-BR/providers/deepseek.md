---
read_when:
    - Você quer usar o DeepSeek com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do DeepSeek (autenticação + seleção de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T15:39:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) fornece modelos avançados de IA com uma API compatível com a OpenAI.

| Propriedade | Valor                      |
| ----------- | -------------------------- |
| Provedor    | `deepseek`                 |
| Autenticação | `DEEPSEEK_API_KEY`         |
| API         | Compatível com a OpenAI    |
| URL base    | `https://api.deepseek.com` |

## Instalar o plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API em [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Execute a configuração inicial">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Solicita sua chave de API e define `deepseek/deepseek-v4-flash` como o modelo padrão.

  </Step>
  <Step title="Verifique se os modelos estão disponíveis">
    ```bash
    openclaw models list --provider deepseek
    ```

    Para inspecionar o catálogo estático do plugin sem um Gateway em execução:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuração não interativa">
    Para instalações automatizadas ou sem interface, passe todas as opções diretamente:

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
Se o Gateway for executado como um daemon (launchd/systemd), certifique-se de que `DEEPSEEK_API_KEY` esteja
disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou por meio de
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Referência do modelo         | Nome              | Entrada | Contexto  | Saída máxima | Observações                                                  |
| ---------------------------- | ----------------- | ------- | --------- | ------------ | ------------------------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | texto   | 1,000,000 | 384,000      | Modelo padrão; interface V4 com capacidade de raciocínio     |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | texto   | 1,000,000 | 384,000      | Interface V4 com capacidade de raciocínio                    |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texto   | 1,000,000 | 384,000      | Nome de compatibilidade obsoleto do V4 Flash sem raciocínio  |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texto   | 1,000,000 | 384,000      | Nome de compatibilidade obsoleto do V4 Flash com raciocínio  |

<Warning>
A DeepSeek descontinuará `deepseek-chat` e `deepseek-reasoner` em 24 de julho de 2026,
às 15:59 UTC. Atualmente, eles são encaminhados ao DeepSeek V4 Flash nos modos sem
raciocínio e com raciocínio, respectivamente. Migre as referências de modelo configuradas para
`deepseek/deepseek-v4-flash` ou `deepseek/deepseek-v4-pro` antes do prazo.
</Warning>

As estimativas locais de custo do OpenClaw seguem as tarifas publicadas pela DeepSeek para acertos de cache,
falhas de cache e saída. A DeepSeek pode alterar essas tarifas; sua página
[Modelos e preços](https://api-docs.deepseek.com/quick_start/pricing/) é a
fonte oficial para cobrança.

<Tip>
Os modelos V4 oferecem suporte ao controle `thinking` da DeepSeek. O OpenClaw também reproduz
o `reasoning_content` da DeepSeek em interações subsequentes, permitindo que sessões de raciocínio com chamadas de
ferramentas continuem.
Use `/think xhigh` ou `/think max` com modelos DeepSeek V4 para solicitar o
`reasoning_effort` máximo da DeepSeek; ambos correspondem a `"max"`.
</Tip>

## Raciocínio e ferramentas

As sessões de raciocínio do DeepSeek V4 exigem que mensagens reproduzidas do assistente, provenientes de uma
interação com raciocínio habilitado, incluam `reasoning_content` nas solicitações subsequentes.
O plugin DeepSeek do OpenClaw preenche esse campo automaticamente, de modo que o uso normal de
ferramentas em várias interações funciona em `deepseek/deepseek-v4-flash` e
`deepseek/deepseek-v4-pro`, mesmo quando o histórico veio de outro
provedor compatível com a OpenAI (sem `reasoning_content` nativo) ou de uma mensagem simples
do assistente. Não é necessário usar `/new` após trocar de provedor durante a sessão.

Quando o raciocínio está desabilitado (incluindo a seleção **Nenhum** na interface), o OpenClaw
envia `thinking: { type: "disabled" }` e remove o `reasoning_content` reproduzido
do histórico enviado, mantendo a sessão no fluxo sem raciocínio da DeepSeek.

Use `deepseek/deepseek-v4-flash` como fluxo rápido padrão. Use
`deepseek/deepseek-v4-pro` para obter o modelo mais avançado quando puder aceitar um custo
ou uma latência maior.

## Testes em ambiente real

Para executar apenas as verificações diretas dos modelos DeepSeek V4 no conjunto moderno de testes em ambiente real de modelos:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Verifica se ambos os modelos V4 concluem a execução e se as interações subsequentes de raciocínio/ferramentas
preservam a carga útil reproduzida exigida pela DeepSeek.

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
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelo e o comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
