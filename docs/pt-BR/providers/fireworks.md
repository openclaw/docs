---
read_when:
    - Você quer usar o Fireworks com o OpenClaw
    - Você precisa da variável de ambiente da chave de API do Fireworks ou do ID do modelo padrão
    - Você está depurando o comportamento do Kimi com o raciocínio desativado no Fireworks
summary: Configuração do Fireworks (autenticação + seleção de modelo)
title: Fogos de artifício
x-i18n:
    generated_at: "2026-05-06T09:10:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) expõe modelos open-weight e roteados por meio de uma API compatível com OpenAI. O OpenClaw inclui um Plugin de provedor Fireworks integrado que vem com dois modelos Kimi pré-catalogados e aceita qualquer modelo ou id de roteador do Fireworks em tempo de execução.

| Propriedade                 | Valor                                                  |
| --------------------------- | ------------------------------------------------------ |
| Id do provedor              | `fireworks` (alias: `fireworks-ai`)                    |
| Plugin                      | integrado, `enabledByDefault: true`                    |
| Variável env de autenticação | `FIREWORKS_API_KEY`                                    |
| Flag de integração          | `--auth-choice fireworks-api-key`                      |
| Flag direta da CLI          | `--fireworks-api-key <key>`                            |
| API                         | compatível com OpenAI (`openai-completions`)           |
| URL base                    | `https://api.fireworks.ai/inference/v1`                |
| Modelo padrão               | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias padrão                | `Kimi K2.5 Turbo`                                      |

## Primeiros passos

<Steps>
  <Step title="Defina a chave de API do Fireworks">
    <CodeGroup>

```bash Integração
openclaw onboard --auth-choice fireworks-api-key
```

```bash Flag direta
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Somente env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    A integração armazena a chave para o provedor `fireworks` nos seus perfis de autenticação e define o roteador Kimi K2.5 Turbo **Fire Pass** como o modelo padrão.

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider fireworks
    ```

    A lista deve incluir `Kimi K2.6` e `Kimi K2.5 Turbo (Fire Pass)`. Se `FIREWORKS_API_KEY` não for resolvida, `openclaw models status --json` informará a credencial ausente em `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuração não interativa

Para instalações com script ou em CI, passe tudo pela linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Ref do modelo                                           | Nome                        | Entrada        | Contexto | Saída máx. | Pensamento                 |
| ------------------------------------------------------- | --------------------------- | -------------- | -------- | ---------- | -------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`         | Kimi K2.6                   | texto + imagem | 262,144  | 262,144    | Forçado como desativado    |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`  | Kimi K2.5 Turbo (Fire Pass) | texto + imagem | 256,000  | 256,000    | Forçado como desativado (padrão) |

<Note>
  O OpenClaw fixa todos os modelos Kimi do Fireworks em `thinking: off` porque o Fireworks rejeita parâmetros de pensamento do Kimi em produção. Rotear o mesmo modelo diretamente pelo [Moonshot](/pt-BR/providers/moonshot) preserva a saída de raciocínio do Kimi. Consulte [modos de pensamento](/pt-BR/tools/thinking) para alternar entre provedores.
</Note>

## Ids de modelos Fireworks personalizados

O OpenClaw aceita qualquer modelo ou id de roteador do Fireworks em tempo de execução. Use o id exato exibido pelo Fireworks e prefixe-o com `fireworks/`. A resolução dinâmica clona o modelo do Fire Pass (entrada de texto + imagem, API compatível com OpenAI, custo padrão zero) e desativa o pensamento automaticamente quando o id corresponde ao padrão do Kimi.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Como funciona a prefixação de id de modelo">
    Toda ref de modelo Fireworks no OpenClaw começa com `fireworks/`, seguida pelo id exato ou caminho de roteador da plataforma Fireworks. Por exemplo:

    - Modelo de roteador: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo direto: `fireworks/accounts/fireworks/models/<model-name>`

    O OpenClaw remove o prefixo `fireworks/` ao construir a solicitação de API e envia o caminho restante para o endpoint do Fireworks como o campo `model` compatível com OpenAI.

  </Accordion>

  <Accordion title="Por que o pensamento é forçado como desativado para o Kimi">
    O Fireworks K2.6 retorna 400 se a solicitação carregar parâmetros `reasoning_*`, embora o Kimi ofereça suporte a pensamento pela API própria do Moonshot. A política integrada (`extensions/fireworks/thinking-policy.ts`) anuncia apenas o nível de pensamento `off` para ids de modelo Kimi, para que alternâncias manuais de `/think` e superfícies de política de provedor permaneçam alinhadas ao contrato de tempo de execução.

    Para usar o raciocínio do Kimi de ponta a ponta, configure o [provedor Moonshot](/pt-BR/providers/moonshot) e roteie o mesmo modelo por ele.

  </Accordion>

  <Accordion title="Disponibilidade do ambiente para o daemon">
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), a chave do Fireworks precisa estar visível para esse processo, não apenas para seu shell interativo.

    <Warning>
      Uma chave presente apenas em `~/.profile` não ajudará um daemon launchd ou systemd, a menos que esse ambiente também seja importado ali. Defina a chave em `~/.openclaw/.env` ou via `env.shellEnv` para torná-la legível pelo processo do gateway.
    </Warning>

    No macOS, `openclaw gateway install` já conecta `~/.openclaw/.env` ao arquivo de ambiente do LaunchAgent. Execute a instalação novamente (ou `openclaw doctor --fix`) depois de rotacionar a chave.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Modos de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de `/think`, políticas de provedor e roteamento de modelos com capacidade de raciocínio.
  </Card>
  <Card title="Moonshot" href="/pt-BR/providers/moonshot" icon="moon">
    Execute o Kimi com saída de pensamento nativa pela API própria do Moonshot.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>
