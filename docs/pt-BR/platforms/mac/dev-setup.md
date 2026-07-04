---
read_when:
    - Configurando o ambiente de desenvolvimento no macOS
summary: Guia de configuração para desenvolvedores que trabalham no app macOS do OpenClaw
title: Configuração de desenvolvimento no macOS
x-i18n:
    generated_at: "2026-07-04T06:25:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuração de desenvolvedor no macOS

Compile e execute o aplicativo OpenClaw para macOS a partir do código-fonte.

## Pré-requisitos

Antes de compilar o aplicativo, verifique se você tem o seguinte instalado:

1. **Xcode 26.2+**: necessário para desenvolvimento em Swift.
2. **Node.js 24 e pnpm**: recomendados para o Gateway, a CLI e os scripts de empacotamento. Node 22 LTS, atualmente `22.19+`, continua compatível.

## 1. Instalar dependências

Instale as dependências de todo o projeto:

```bash
pnpm install
```

## 2. Compilar e empacotar o aplicativo

Para compilar o aplicativo macOS e empacotá-lo em `dist/OpenClaw.app`, execute:

```bash
./scripts/package-mac-app.sh
```

Se você não tiver um certificado de Apple Developer ID, o script usará automaticamente **assinatura ad-hoc** (`-`).

Para modos de execução de desenvolvimento, flags de assinatura e solução de problemas com Team ID, consulte o README do aplicativo macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Observação**: aplicativos assinados ad-hoc podem acionar prompts de segurança. Se o aplicativo falhar imediatamente com "Abort trap 6", consulte a seção [Solução de problemas](#troubleshooting).

## 3. Instalar a CLI e o Gateway

O aplicativo empacotado incorpora o instalador canônico `scripts/install-cli.sh`. Em um
perfil novo, escolha **Este Mac** durante a integração; o aplicativo instala a
CLI e o runtime de espaço do usuário correspondentes antes de iniciar o assistente do Gateway.

Para recuperação manual de desenvolvimento, instale você mesmo a CLI correspondente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` também funcionam.
Para o runtime do Gateway, Node continua sendo o caminho recomendado.

## Solução de problemas

### Falha na compilação: incompatibilidade de toolchain ou SDK

A compilação do aplicativo macOS espera o SDK do macOS mais recente e a toolchain Swift 6.2.

**Dependências do sistema (obrigatórias):**

- **Versão mais recente do macOS disponível na Atualização de Software** (exigida pelos SDKs do Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Verificações:**

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não corresponderem, atualize o macOS/Xcode e execute a compilação novamente.

### O aplicativo falha ao conceder permissão

Se o aplicativo falhar quando você tentar permitir acesso ao **Reconhecimento de Fala** ou ao **Microfone**, isso pode ocorrer devido a um cache TCC corrompido ou a uma incompatibilidade de assinatura.

**Correção:**

1. Redefina as permissões TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se isso falhar, altere temporariamente o `BUNDLE_ID` em [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forçar um "estado limpo" do macOS.

### Gateway "Iniciando..." indefinidamente

Se o status do gateway permanecer em "Iniciando...", verifique se um processo zumbi está mantendo a porta ocupada:

```bash
openclaw gateway status
openclaw gateway stop

# Se você não estiver usando um LaunchAgent (modo de desenvolvimento / execuções manuais), encontre o listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver mantendo a porta ocupada, pare esse processo (Ctrl+C). Como último recurso, encerre o PID encontrado acima.

## Relacionados

- [Aplicativo macOS](/pt-BR/platforms/macos)
- [Visão geral da instalação](/pt-BR/install)
