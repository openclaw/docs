---
read_when:
    - Você quer instalações reproduzíveis e reversíveis
    - Você já usa Nix/NixOS/Home Manager
    - Você quer tudo fixado e gerenciado de forma declarativa
summary: Instalar o OpenClaw declarativamente com Nix
title: Nix
x-i18n:
    generated_at: "2026-04-25T13:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

Instale o OpenClaw de forma declarativa com **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — um módulo Home Manager com tudo incluído.

<Info>
O repositório [nix-openclaw](https://github.com/openclaw/nix-openclaw) é a fonte da verdade para a instalação com Nix. Esta página é uma visão geral rápida.
</Info>

## O que você recebe

- Gateway + app macOS + ferramentas (whisper, spotify, cameras) -- tudo fixado
- Serviço Launchd que sobrevive a reinicializações
- Sistema de Plugin com configuração declarativa
- Reversão instantânea: `home-manager switch --rollback`

## Início rápido

<Steps>
  <Step title="Instalar o Determinate Nix">
    Se o Nix ainda não estiver instalado, siga as instruções do [instalador Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Criar um flake local">
    Use o template agent-first do repositório nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copie templates/agent-first/flake.nix do repositório nix-openclaw
    ```
  </Step>
  <Step title="Configurar segredos">
    Configure o token do seu bot de mensagens e a chave de API do provedor de modelo. Arquivos simples em `~/.secrets/` funcionam bem.
  </Step>
  <Step title="Preencher os placeholders do template e aplicar">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verificar">
    Confirme que o serviço Launchd está em execução e que seu bot responde a mensagens.
  </Step>
</Steps>

Consulte o [README do nix-openclaw](https://github.com/openclaw/nix-openclaw) para ver todas as opções do módulo e exemplos.

## Comportamento de runtime no modo Nix

Quando `OPENCLAW_NIX_MODE=1` está definido (automático com nix-openclaw), o OpenClaw entra em um modo determinístico que desabilita fluxos de instalação automática.

Você também pode defini-lo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

No macOS, o app GUI não herda automaticamente variáveis de ambiente do shell. Habilite o modo Nix por defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### O que muda no modo Nix

- Fluxos de instalação automática e automutação são desabilitados
- Dependências ausentes exibem mensagens de remediação específicas para Nix
- A UI mostra um banner somente leitura do modo Nix

### Caminhos de configuração e estado

O OpenClaw lê a configuração JSON5 de `OPENCLAW_CONFIG_PATH` e armazena dados mutáveis em `OPENCLAW_STATE_DIR`. Ao executar sob Nix, defina isso explicitamente para locais gerenciados pelo Nix para que o estado e a configuração de runtime fiquem fora do store imutável.

| Variável               | Padrão                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Descoberta de PATH do serviço

O serviço launchd/systemd do gateway descobre automaticamente binários do perfil Nix para que
plugins e ferramentas que executam `shell out` para executáveis instalados por `nix` funcionem sem
configuração manual de PATH:

- Quando `NIX_PROFILES` está definido, cada entrada é adicionada ao PATH do serviço em
  precedência da direita para a esquerda (corresponde à precedência do shell do Nix — o item mais à direita vence).
- Quando `NIX_PROFILES` não está definido, `~/.nix-profile/bin` é adicionado como fallback.

Isso se aplica tanto aos ambientes de serviço launchd no macOS quanto systemd no Linux.

## Relacionado

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- guia completo de configuração
- [Assistente](/pt-BR/start/wizard) -- configuração de CLI sem Nix
- [Docker](/pt-BR/install/docker) -- configuração em contêiner
