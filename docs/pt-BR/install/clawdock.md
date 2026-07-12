---
read_when:
    - Você usa o OpenClaw com Docker com frequência e quer comandos mais curtos para o dia a dia
    - Você quer uma camada auxiliar para o painel, os logs, a configuração de tokens e os fluxos de pareamento
summary: Auxiliares de shell do ClawDock para instalações do OpenClaw baseadas em Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-11T23:59:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock é uma pequena camada de utilitários de shell para instalações do OpenClaw baseadas em Docker.

Ela oferece comandos curtos como `clawdock-start`, `clawdock-dashboard` e `clawdock-fix-token` em vez de invocações mais longas de `docker compose ...`.

Se você ainda não configurou o Docker, comece por [Docker](/pt-BR/install/docker).

## Instalação

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou anteriormente o ClawDock a partir de `scripts/shell-helpers/clawdock-helpers.sh`, reinstale-o usando o caminho atual `scripts/clawdock/clawdock-helpers.sh`; o caminho antigo de conteúdo bruto do GitHub foi removido.

Os utilitários detectam automaticamente seu checkout do OpenClaw no primeiro uso (verificando caminhos comuns, como `~/openclaw` e `~/projects/openclaw`) e armazenam o resultado em cache em `~/.clawdock/config`. Defina `CLAWDOCK_DIR` manualmente se seu checkout estiver em outro local.

## O que está incluído

### Operações básicas

| Comando             | Descrição                        |
| ------------------- | -------------------------------- |
| `clawdock-start`    | Iniciar o Gateway                |
| `clawdock-stop`     | Parar o Gateway                  |
| `clawdock-restart`  | Reiniciar o Gateway              |
| `clawdock-status`   | Verificar o status do contêiner  |
| `clawdock-logs`     | Acompanhar os logs do Gateway    |

### Acesso ao contêiner

| Comando                   | Descrição                                          |
| ------------------------- | -------------------------------------------------- |
| `clawdock-shell`          | Abrir um shell dentro do contêiner do Gateway      |
| `clawdock-cli <command>`  | Executar comandos da CLI do OpenClaw no Docker     |
| `clawdock-exec <command>` | Executar um comando arbitrário no contêiner        |

### Interface web e pareamento

| Comando                 | Descrição                             |
| ----------------------- | ------------------------------------- |
| `clawdock-dashboard`    | Abrir a URL da interface de controle  |
| `clawdock-devices`      | Listar pareamentos de dispositivos pendentes |
| `clawdock-approve <id>` | Aprovar uma solicitação de pareamento |

### Configuração e manutenção

| Comando              | Descrição                                                  |
| -------------------- | ---------------------------------------------------------- |
| `clawdock-fix-token` | Gravar o token do Gateway na configuração do contêiner     |
| `clawdock-update`    | Baixar, recompilar e reiniciar                              |
| `clawdock-rebuild`   | Recompilar somente a imagem do Docker                      |
| `clawdock-clean`     | Remover contêineres e volumes                              |

### Utilitários

| Comando                | Descrição                                               |
| ---------------------- | ------------------------------------------------------- |
| `clawdock-health`      | Executar uma verificação de integridade do Gateway      |
| `clawdock-token`       | Exibir o token do Gateway                               |
| `clawdock-cd`          | Ir para o diretório do projeto OpenClaw                 |
| `clawdock-config`      | Abrir `~/.openclaw`                                     |
| `clawdock-show-config` | Exibir arquivos de configuração com valores ocultados   |
| `clawdock-workspace`   | Abrir o diretório do espaço de trabalho                 |
| `clawdock-help`        | Listar todos os comandos do ClawDock                    |

## Fluxo inicial

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Se o navegador informar que o pareamento é necessário:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuração e segredos

O ClawDock lê dois arquivos `.env` separados, de acordo com a divisão descrita em [Docker](/pt-BR/install/docker):

- O `.env` do projeto ao lado de `docker-compose.yml`: valores específicos do Docker, como nome da imagem, portas e `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` lê o token desse arquivo.
- `~/.openclaw/.env` (montado no contêiner): segredos provenientes de variáveis de ambiente gerenciados pelo próprio OpenClaw, junto com `openclaw.json` e `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` copia o token do `.env` do projeto para os valores de configuração `gateway.remote.token` e `gateway.auth.token` do contêiner e reinicia o Gateway.

Use `clawdock-show-config` para inspecionar rapidamente o `openclaw.json` e ambos os arquivos `.env`; ele oculta os valores de `.env` na saída exibida.

## Relacionados

<CardGroup cols={2}>
  <Card title="Docker" href="/pt-BR/install/docker" icon="docker">
    Instalação canônica do OpenClaw com Docker.
  </Card>
  <Card title="Ambiente de execução de VM do Docker" href="/pt-BR/install/docker-vm-runtime" icon="cube">
    Ambiente de execução de VM gerenciado pelo Docker para isolamento reforçado.
  </Card>
  <Card title="Atualização" href="/pt-BR/install/updating" icon="arrow-up-right-from-square">
    Atualização do pacote OpenClaw e dos serviços gerenciados.
  </Card>
</CardGroup>
