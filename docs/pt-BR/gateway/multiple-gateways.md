---
read_when:
    - Executando mais de um Gateway na mesma máquina
    - Você precisa de configuração/estado/portas isolados por Gateway
summary: Execute vários Gateways do OpenClaw em um único host (isolamento, portas e perfis)
title: Vários gateways
x-i18n:
    generated_at: "2026-07-11T23:58:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

A maioria das configurações precisa de um Gateway — um único Gateway gerencia várias conexões de mensagens e agentes. Execute Gateways separados, com perfis/portas isolados, somente quando precisar de maior isolamento ou redundância (por exemplo, um bot de resgate).

## Início rápido do bot de resgate

A configuração mais simples para um bot de resgate:

- Mantenha o bot principal no perfil padrão.
- Execute o bot de resgate com `--profile rescue`, usando seu próprio token de bot do Telegram.
- Coloque o bot de resgate em uma porta base diferente, por exemplo, `19789`.

Isso permite que o bot de resgate depure ou aplique alterações de configuração caso o bot principal esteja fora do ar. Deixe pelo menos 20 portas de intervalo entre as portas base para que as portas derivadas do navegador/CDP nunca entrem em conflito.

```bash
# Bot de resgate (bot do Telegram separado, perfil separado, porta 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Se o bot principal já estiver em execução, normalmente isso é tudo o que você precisa. Se a integração inicial já tiver instalado o serviço de resgate, ignore o `gateway install` final.

Durante `openclaw --profile rescue onboard`:

- Use um token de bot do Telegram separado, dedicado à conta de resgate (fácil de restringir apenas aos operadores, independente da instalação do canal/aplicativo do bot principal e um caminho simples de recuperação por mensagem direta).
- Mantenha o nome de perfil `rescue`.
- Use uma porta base pelo menos 20 números acima da porta do bot principal.
- Aceite o espaço de trabalho de resgate padrão, a menos que você já gerencie um por conta própria.

### O que `--profile rescue onboard` altera

`--profile rescue onboard` executa o fluxo normal de integração inicial, mas grava tudo em um perfil separado, portanto o bot de resgate recebe seus próprios:

- Arquivo de perfil/configuração
- Diretório de estado
- Espaço de trabalho (padrão: `~/.openclaw/workspace-rescue`)
- Nome do serviço gerenciado
- Porta base (além das portas derivadas)
- Token de bot do Telegram

Fora isso, as solicitações são idênticas às da integração inicial normal.

## Configuração geral de vários Gateways

O mesmo padrão de isolamento funciona para qualquer par ou grupo de Gateways em um único host — atribua a cada Gateway adicional seu próprio perfil nomeado e sua própria porta base:

```bash
# principal (perfil padrão)
openclaw setup
openclaw gateway --port 18789

# Gateway adicional
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Perfis nomeados em ambos os lados também funcionam:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Os serviços seguem o mesmo padrão:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Use o início rápido do bot de resgate como uma via alternativa para operadores; use o padrão geral de perfis para vários Gateways de longa duração em diferentes canais, locatários, espaços de trabalho ou funções operacionais.

## Lista de verificação de isolamento

Mantenha estas configurações exclusivas para cada instância do Gateway:

| Configuração                  | Finalidade                                          |
| ---------------------------- | --------------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | Arquivo de configuração por instância               |
| `OPENCLAW_STATE_DIR`         | Sessões, credenciais e caches por instância          |
| `agents.defaults.workspace`  | Raiz do espaço de trabalho por instância             |
| `gateway.port` (ou `--port`) | Exclusiva para cada instância                        |
| Portas derivadas do navegador/CDP | Veja abaixo                                    |

Compartilhar qualquer uma delas causa condições de corrida na configuração e conflitos de portas.

## Mapeamento de portas (derivadas)

Porta base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- Porta do serviço de controle do navegador = base + 2 (somente local loopback).
- O host do Canvas é servido no próprio servidor HTTP do Gateway (a mesma porta de `gateway.port`).
- As portas CDP dos perfis do navegador são alocadas automaticamente de `browser control port + 9` até `+ 108`.

Se você substituir qualquer uma delas na configuração ou no ambiente, deverá mantê-las exclusivas para cada instância.

## Observações sobre navegador/CDP (armadilha comum)

- **Não** fixe `browser.cdpUrl` com o mesmo valor em várias instâncias.
- Cada instância precisa de sua própria porta de controle do navegador e faixa CDP (derivadas da porta de seu Gateway).
- Para portas CDP explícitas, defina `browser.profiles.<name>.cdpPort` por instância.
- Para um Chrome remoto, use `browser.profiles.<name>.cdpUrl` (por perfil e por instância).

## Exemplo manual com variáveis de ambiente

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Verificações rápidas

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- `gateway status --deep` detecta serviços obsoletos do launchd/systemd/schtasks provenientes de instalações anteriores.
- Textos de aviso de `gateway probe`, como `multiple reachable gateway identities detected`, são esperados somente quando você executa intencionalmente mais de um Gateway isolado ou quando o OpenClaw não consegue comprovar que os destinos de sondagem acessíveis são o mesmo Gateway. Um túnel SSH, uma URL de proxy ou uma URL remota configurada para o mesmo Gateway representam um único Gateway com vários transportes, mesmo quando as portas de transporte são diferentes.

## Conteúdo relacionado

- [Guia operacional do Gateway](/pt-BR/gateway)
- [Bloqueio do Gateway](/pt-BR/gateway/gateway-lock)
- [Configuração](/pt-BR/gateway/configuration)
