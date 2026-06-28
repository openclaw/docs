---
read_when:
    - Você quer instalações reproduzíveis e reversíveis
    - Você já está usando Nix/NixOS/Home Manager
    - Você quer tudo fixado e gerenciado de forma declarativa
summary: Instale o OpenClaw declarativamente com Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:57:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Instale o OpenClaw declarativamente com **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - o módulo Home Manager oficial, completo e pronto para uso.

<Info>
O repositório [nix-openclaw](https://github.com/openclaw/nix-openclaw) é a fonte da verdade para a instalação com Nix. Esta página é uma visão geral rápida.
</Info>

## O que você recebe

- Gateway + app macOS + ferramentas (whisper, spotify, cameras) -- tudo com versões fixadas
- Serviço launchd que sobrevive a reinicializações
- Sistema de Plugin com configuração declarativa
- Rollback instantâneo: `home-manager switch --rollback`

## Início rápido

<Steps>
  <Step title="Instale o Determinate Nix">
    Se o Nix ainda não estiver instalado, siga as instruções do [instalador Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crie um flake local">
    Use o modelo agent-first do repositório nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configure segredos">
    Configure o token do seu bot de mensagens e a chave de API do provedor de modelo. Arquivos simples em `~/.secrets/` funcionam bem.
  </Step>
  <Step title="Preencha os placeholders do modelo e aplique">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifique">
    Confirme que o serviço launchd está em execução e que seu bot responde a mensagens.
  </Step>
</Steps>

Consulte o [README do nix-openclaw](https://github.com/openclaw/nix-openclaw) para ver todas as opções e exemplos do módulo.

## Comportamento de runtime no modo Nix

Quando `OPENCLAW_NIX_MODE=1` está definido (automaticamente com nix-openclaw), o OpenClaw entra em um modo determinístico para instalações gerenciadas pelo Nix. Outros pacotes Nix podem definir o mesmo modo; o nix-openclaw é a referência oficial.

Você também pode defini-lo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

No macOS, o app com GUI não herda automaticamente variáveis de ambiente do shell. Em vez disso, habilite o modo Nix via defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### O que muda no modo Nix

- Fluxos de instalação automática e automutação são desabilitados
- `openclaw.json` é tratado como imutável. Padrões derivados da inicialização permanecem somente em runtime, e gravadores de configuração como setup, onboarding, `openclaw update` mutável, instalação/atualização/desinstalação/habilitação de plugins, `doctor --fix`, `doctor --generate-gateway-token` e `openclaw config set` se recusam a editar o arquivo.
- Agentes devem editar a fonte Nix em vez disso. Para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) agent-first e defina a configuração em `programs.openclaw.config` ou `instances.<name>.config`.
- Dependências ausentes exibem mensagens de correção específicas do Nix
- A UI exibe um banner de modo Nix somente leitura

### Caminhos de configuração e estado

O OpenClaw lê a configuração JSON5 de `OPENCLAW_CONFIG_PATH` e armazena dados mutáveis em `OPENCLAW_STATE_DIR`. Ao executar sob o Nix, defina esses valores explicitamente para locais gerenciados pelo Nix, para que o estado de runtime e a configuração fiquem fora do store imutável.

| Variável               | Padrão                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Descoberta do PATH do serviço

O serviço Gateway launchd/systemd descobre automaticamente binários de perfis Nix para que
plugins e ferramentas que executam executáveis instalados por `nix` via shell funcionem sem
configuração manual de PATH:

- Quando `NIX_PROFILES` está definido, cada entrada é adicionada ao PATH do serviço com
  precedência da direita para a esquerda (corresponde à precedência do shell Nix - o mais à direita vence).
- Quando `NIX_PROFILES` não está definido, `~/.nix-profile/bin` é adicionado como fallback.

Isso se aplica aos ambientes de serviço launchd do macOS e systemd do Linux.

## Relacionados

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Módulo Home Manager fonte da verdade e guia completo de configuração.
  </Card>
  <Card title="Assistente de configuração" href="/pt-BR/start/wizard" icon="wand-magic-sparkles">
    Passo a passo de configuração via CLI sem Nix.
  </Card>
  <Card title="Docker" href="/pt-BR/install/docker" icon="docker">
    Configuração conteinerizada como alternativa sem Nix.
  </Card>
  <Card title="Atualização" href="/pt-BR/install/updating" icon="arrow-up-right-from-square">
    Atualização de instalações gerenciadas pelo Home Manager junto com o pacote.
  </Card>
</CardGroup>
