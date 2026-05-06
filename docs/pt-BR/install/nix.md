---
read_when:
    - Você quer instalações reproduzíveis e reversíveis
    - Você já está usando Nix/NixOS/Home Manager
    - Você quer tudo fixado e gerenciado de forma declarativa
summary: Instale o OpenClaw de forma declarativa com Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T06:01:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

Instale o OpenClaw de forma declarativa com **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - um módulo Home Manager completo.

<Info>
O repositório [nix-openclaw](https://github.com/openclaw/nix-openclaw) é a fonte da verdade para a instalação com Nix. Esta página é uma visão geral rápida.
</Info>

## O que você recebe

- Gateway + aplicativo macOS + ferramentas (whisper, spotify, cameras) -- tudo fixado
- Serviço launchd que sobrevive a reinicializações
- Sistema de Plugin com configuração declarativa
- Reversão instantânea: `home-manager switch --rollback`

## Início rápido

<Steps>
  <Step title="Install Determinate Nix">
    Se o Nix ainda não estiver instalado, siga as instruções do [instalador Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Create a local flake">
    Use o template agent-first do repositório nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configure secrets">
    Configure o token do seu bot de mensagens e a chave de API do provedor de modelo. Arquivos simples em `~/.secrets/` funcionam bem.
  </Step>
  <Step title="Fill in template placeholders and switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verify">
    Confirme que o serviço launchd está em execução e que seu bot responde a mensagens.
  </Step>
</Steps>

Consulte o [README do nix-openclaw](https://github.com/openclaw/nix-openclaw) para ver todas as opções e exemplos do módulo.

## Comportamento de runtime no modo Nix

Quando `OPENCLAW_NIX_MODE=1` está definido (automático com nix-openclaw), o OpenClaw entra em um modo determinístico que desativa fluxos de instalação automática.

Você também pode defini-lo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

No macOS, o aplicativo GUI não herda automaticamente variáveis de ambiente do shell. Em vez disso, habilite o modo Nix via defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### O que muda no modo Nix

- Fluxos de instalação automática e automutação são desativados
- Dependências ausentes exibem mensagens de correção específicas do Nix
- A UI exibe um banner de modo Nix somente leitura

### Caminhos de configuração e estado

O OpenClaw lê a configuração JSON5 de `OPENCLAW_CONFIG_PATH` e armazena dados mutáveis em `OPENCLAW_STATE_DIR`. Ao executar com Nix, defina esses caminhos explicitamente para locais gerenciados pelo Nix, para que o estado de runtime e a configuração fiquem fora da store imutável.

| Variável               | Padrão                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Descoberta de PATH do serviço

O serviço Gateway do launchd/systemd descobre automaticamente binários do perfil Nix para que
plugins e ferramentas que executam shell para executáveis instalados por `nix` funcionem sem
configuração manual de PATH:

- Quando `NIX_PROFILES` está definido, cada entrada é adicionada ao PATH do serviço em
  precedência da direita para a esquerda (corresponde à precedência do shell Nix - o mais à direita vence).
- Quando `NIX_PROFILES` não está definido, `~/.nix-profile/bin` é adicionado como fallback.

Isso se aplica aos ambientes de serviço launchd do macOS e systemd do Linux.

## Relacionados

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Módulo Home Manager fonte da verdade e guia completo de configuração.
  </Card>
  <Card title="Setup wizard" href="/pt-BR/start/wizard" icon="wand-magic-sparkles">
    Passo a passo de configuração da CLI sem Nix.
  </Card>
  <Card title="Docker" href="/pt-BR/install/docker" icon="docker">
    Configuração conteinerizada como alternativa sem Nix.
  </Card>
  <Card title="Updating" href="/pt-BR/install/updating" icon="arrow-up-right-from-square">
    Atualização de instalações gerenciadas pelo Home Manager junto com o pacote.
  </Card>
</CardGroup>
