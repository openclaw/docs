---
read_when:
    - Você quer usar a Meta com o OpenClaw
    - Você precisa da variável de ambiente MODEL_API_KEY ou da opção de autenticação da CLI
summary: Configuração do Meta (autenticação + seleção do modelo muse-spark-1.1)
title: Metadados
x-i18n:
    generated_at: "2026-07-12T00:19:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

A **API da Meta** usa a **Responses API** compatível com a OpenAI (`POST /v1/responses`)
para o modelo de raciocínio `muse-spark-1.1`. O provedor é distribuído como um plugin
incluído no OpenClaw.

| Propriedade          | Valor                              |
| -------------------- | ---------------------------------- |
| ID do provedor       | `meta`                             |
| Plugin               | provedor incluído                  |
| Variável de ambiente de autenticação | `MODEL_API_KEY`      |
| Sinalizador de integração inicial | `--auth-choice meta-api-key` |
| Sinalizador direto da CLI | `--meta-api-key <key>`         |
| API                  | Responses API (`openai-responses`) |
| URL base             | `https://api.meta.ai/v1`           |
| Modelo padrão        | `meta/muse-spark-1.1`              |
| Raciocínio padrão    | `high` (`reasoning.effort`)        |

## Primeiros passos

<Steps>
  <Step title="Defina a chave da API">
    <CodeGroup>

```bash Integração inicial
openclaw onboard --auth-choice meta-api-key
```

```bash Sinalizador direto
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Somente variável de ambiente
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Verifique se os modelos estão disponíveis">
    ```bash
    openclaw models list --provider meta
    ```

    Lista a entrada estática `muse-spark-1.1` do catálogo. Se `MODEL_API_KEY` não for resolvida,
    `openclaw models status --json` informará a credencial ausente em
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuração não interativa

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Catálogo integrado

| Referência do modelo  | Nome           | Raciocínio | Janela de contexto | Saída máxima |
| --------------------- | -------------- | ---------- | ------------------ | ------------ |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | sim        | 1,048,576          | 131,072      |

Recursos:

- Entrada de texto e imagem
- Chamada de ferramentas e transmissão contínua
- Esforço de raciocínio: `minimal`, `low`, `medium`, `high`, `xhigh` (padrão: `high`)
- Reprodução de raciocínio criptografado sem estado (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` não aceita `reasoning.effort: "none"`. O OpenClaw mapeia
`--thinking off` para `minimal` neste provedor.
</Warning>

## Configuração manual

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Se o Gateway for executado como um daemon (launchd, systemd, Docker), verifique se
`MODEL_API_KEY` está disponível para esse processo — por exemplo, em
`~/.openclaw/.env` ou por meio de `env.shellEnv`. Uma chave exportada somente em um
shell interativo não ajudará um serviço gerenciado, a menos que o ambiente seja importado
separadamente.
</Note>

## Teste de fumaça

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Os testes em tempo real usam `muse-spark-1.1` com `POST /v1/responses`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Modos de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio para o muse-spark-1.1.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões dos agentes e configuração de modelos.
  </Card>
</CardGroup>
