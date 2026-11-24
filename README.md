# Laboratório DevOps – Projeto 1
## Primeiro deploy de um site estático com Docker, Nginx e AWS EC2

**CETEP-I Itaparica · Material didático passo a passo para iniciantes absolutos**

Este material foi escrito para quem está tendo o primeiro contato com Docker, Linux e AWS. Leia cada explicação antes de executar o comando. Não pule etapas: cada fase prepara o ambiente para a próxima.

> **Objetivo da prática:** preparar um site estático (HTML, CSS, JavaScript e imagens), construir sua imagem Docker, executar e testar o container no próprio computador e, depois, publicá-lo em uma máquina virtual Ubuntu na AWS (EC2), para que outras pessoas possam acessá-lo pela internet.

> **O que será utilizado:** computador com Windows, Git, conta no GitHub ou acesso a um repositório público, Visual Studio Code (VS Code), terminal integrado do VS Code, Docker Desktop (para construir a imagem localmente), AWS EC2 com Ubuntu, SSH, SCP ou WinSCP, Docker e Nginx.
>
> **O que NÃO será utilizado neste primeiro deploy:** Amazon ECR, AWS CLI, Docker Compose, Kubernetes, Certbot ou banco de dados. Essas ferramentas podem ser estudadas em atividades futuras. Aqui vamos aprender o caminho mais simples: construir uma imagem e executá-la com `docker run`.

---

# 1. Antes de começar: o que vamos fazer?

Imagine que você criou um site no seu computador. Por enquanto, somente você consegue abrir esse site localmente. O objetivo é colocá-lo em um servidor na internet.

Vamos seguir este caminho:

1. Obter os arquivos do projeto no GitHub usando Git.
2. Abrir o projeto clonado no Visual Studio Code.
3. Criar um arquivo chamado `Dockerfile`, que ensinará o Docker a montar o ambiente do site.
4. Construir uma **imagem Docker**.
5. Conferir se a imagem foi criada corretamente.
6. Executar o container no próprio computador.
7. Acessar o site localmente pelo navegador e verificar se está funcionando.
8. Parar o container local e, somente depois, preparar a máquina virtual Ubuntu na AWS (EC2).
9. Acessar a EC2 remotamente usando SSH.
10. Instalar o Docker no Ubuntu.
11. Enviar o projeto do computador para a EC2.
12. Construir a imagem no servidor e iniciar o container.
13. Abrir o site pelo IP público da EC2.

## 1.1 Palavras que você precisa entender

| Palavra | Explicação simples |
|---|---|
| Site estático | Site formado por arquivos prontos, como HTML, CSS, JavaScript e imagens. Não precisa de um servidor de aplicação para gerar páginas dinamicamente. |
| HTML | Linguagem que define a estrutura e o conteúdo da página. |
| CSS | Linguagem que define a aparência: cores, fontes, tamanhos e posicionamento. |
| JavaScript | Linguagem que permite interações e comportamentos na página. |
| Servidor | Computador ou programa que fornece um serviço para outros computadores. |
| AWS | Plataforma de serviços de computação em nuvem. |
| EC2 | Serviço da AWS que oferece máquinas virtuais, como se alugássemos um computador na nuvem. |
| Ubuntu | Sistema operacional Linux que será instalado na máquina EC2. |
| Terminal | Programa no qual digitamos comandos para controlar o computador. |
| Git | Ferramenta instalada no computador que controla versões e histórico de alterações dos arquivos. |
| GitHub | Plataforma na internet que hospeda repositórios Git e permite compartilhar e colaborar em projetos. |
| Repositório | Local onde ficam guardados os arquivos e o histórico de alterações de um projeto. |
| `git clone` | Comando que copia um repositório remoto para o computador, criando uma cópia local. |
| `git pull` | Comando que busca e integra atualizações do repositório remoto na cópia local. |
| SSH | Protocolo que permite acessar com segurança o terminal de outra máquina pela rede. |
| Docker | Plataforma que permite criar e executar aplicações em containers. |
| Dockerfile | Arquivo de texto com instruções que ensinam o Docker a construir uma imagem. |
| Imagem | Pacote que contém o necessário para criar e iniciar um container. É como um molde ou modelo. |
| Container | Instância criada a partir de uma imagem. É o ambiente que está executando. |
| Nginx | Servidor web que recebe solicitações HTTP e entrega os arquivos do site ao navegador. |
| Porta | Número usado para identificar um serviço de rede. Neste laboratório, usaremos a porta 80 no computador local, na EC2 e dentro do container. |
| Security Group | Firewall virtual da AWS que controla quais conexões podem chegar à EC2. |

## 1.2 Diferença entre Dockerfile, imagem e container

Pense em uma receita de bolo:

- **Dockerfile:** é a receita. Contém as instruções.
- **Imagem:** é o bolo preparado conforme a receita, pronto para ser utilizado como modelo.
- **Container:** é uma execução desse modelo. Podemos criar vários containers a partir da mesma imagem.

O Dockerfile não é o container e também não é a imagem. Ele é o arquivo usado para construir a imagem.

## 1.3 Como será o trabalho: primeiro local, depois na nuvem

Nesta atividade, vamos dividir o trabalho em duas partes. Primeiro, vamos construir e testar tudo no computador. Depois que confirmarmos que o site funciona localmente, vamos repetir a construção e a execução na EC2.

**Parte 1 – No computador do aluno:**

```text
VS CODE + DOCKER DESKTOP
  Dockerfile e arquivos do site
          |
          | docker build
          v
    IMAGEM DOCKER
          |
          | docker run -p 80:80
          v
  CONTAINER COM NGINX
          |
          v
  http://localhost
```

**Parte 2 – Na AWS EC2:**

```text
COMPUTADOR DO ALUNO
  Dockerfile e pasta website
          |
          | SCP ou WinSCP: envia os arquivos
          v
AWS EC2 – UBUNTU
  Docker instalado
       |
       | docker build e docker run
       v
CONTAINER COM NGINX
  Nginx escutando na porta 80
       |
       | encaminhamento de portas: 80 -> 80
       v
NAVEGADOR DO VISITANTE
  http://IP_PUBLICO_DA_EC2
```

**Em palavras simples:** primeiro, o navegador do próprio aluno acessa `http://localhost` para testar o site no computador. Na EC2, o visitante acessa diretamente o IP público, também sem informar uma porta na URL. Nos dois casos, utilizaremos a porta 80 na máquina local ou no servidor e a porta 80 dentro do container.

---

# 2. Preparar o computador

## 2.1 O que você precisa ter

- Windows 10 ou 11.
- Pasta do projeto do site.
- Conta AWS autorizada a criar uma instância EC2.
- Git instalado no Windows (Git for Windows).
- Visual Studio Code (VS Code) instalado no Windows.
- Docker Desktop instalado e funcionando no computador, para construir a imagem localmente.
- Terminal integrado do VS Code (usaremos PowerShell como shell padrão no Windows).
- Chave privada SSH no formato `.pem`, criada ao configurar a EC2.
- WinSCP, opcional, caso prefira transferir arquivos por uma interface gráfica.

**Atenção aos custos:** recursos da AWS podem gerar cobrança. Utilize a conta e o tipo de instância indicados pelo professor. Não crie várias instâncias sem autorização.

## 2.2 Abrir o VS Code e conferir o Docker

Nesta atividade, vamos utilizar o **Visual Studio Code (VS Code)** para abrir, visualizar e editar os arquivos do projeto. Também vamos executar os comandos no terminal que existe dentro do próprio VS Code.

### Passo 1 – Abrir o VS Code

1. Abra o Visual Studio Code pelo menu Iniciar do Windows.
2. Aguarde a janela do programa abrir.

### Passo 2 – Abrir o terminal integrado

1. No menu superior, clique em **Terminal**.
2. Clique em **Novo Terminal**.
3. Um painel será aberto na parte inferior do VS Code.
4. No Windows, normalmente o terminal será o PowerShell. Isso é normal: ele estará aberto dentro do VS Code.

> **Atenção:** quando este material disser “terminal integrado do VS Code”, estamos falando desse painel inferior. Os comandos de Windows devem ser digitados nele. Os comandos Linux devem ser digitados somente depois de entrar na EC2 por SSH.

### Passo 3 – Conferir se o Docker está instalado

No terminal integrado do VS Code, execute:

```powershell
docker --version
```

**O que significa cada parte?**

- `docker`: chama o programa Docker.
- `--version`: pede que o programa mostre sua versão.
- `--`: os dois traços indicam uma opção ou parâmetro do comando.

Se aparecer algo como `Docker version ...`, o comando Docker está instalado.

Agora execute:

```powershell
docker info
```

Esse comando mostra informações do ambiente Docker, como imagens, containers e configurações. Ele também verifica se o terminal consegue conversar com o Docker Engine.

Se aparecer uma mensagem como `Cannot connect to the Docker daemon`, abra o Docker Desktop e espere ele terminar de iniciar. Depois tente novamente.

---


## 2.3 Obter o projeto do GitHub usando Git

Nesta atividade, não vamos baixar ZIP nem extrair arquivos manualmente. Vamos utilizar o **Git**, que baixa o projeto diretamente do GitHub e facilita obter atualizações depois.

### Primeiro: entender Git e GitHub

- **Git:** programa instalado no computador. Ele controla as versões dos arquivos e permite baixar atualizações.
- **GitHub:** site na internet onde o repositório do projeto está hospedado.
- **Repositório:** é o projeto armazenado no GitHub, com seus arquivos e histórico de alterações.
- **`git clone`:** comando que copia o repositório do GitHub para o computador, criando uma pasta com os arquivos do projeto.

Pense assim: o Git é a ferramenta que faz o serviço; o GitHub é o local na internet onde o projeto está guardado.

### Passo 1 – Instalar o Git no Windows

1. Abra o navegador e acesse https://git-scm.com/downloads.
2. Baixe a versão do Git para Windows.
3. Execute o instalador.
4. Se não souber o que escolher, mantenha as opções padrão e avance até concluir a instalação.
5. Feche e abra novamente o VS Code para que ele reconheça o Git.

> Se o Git já estiver instalado no computador, pule a instalação e faça a conferência abaixo.

### Passo 2 – Conferir se o Git está instalado

No VS Code, abra **Terminal > Novo Terminal** e execute:

```powershell
git --version
```

O que significa:

- `git`: chama o programa Git.
- `--version`: solicita que ele mostre a versão instalada.

Se aparecer algo como `git version 2.x.x`, está instalado corretamente.

Se aparecer que `git` não é reconhecido, feche o VS Code, abra novamente e teste. Se continuar, o Git pode não ter sido instalado corretamente.

### Passo 3 – Copiar o endereço do repositório

O repositório utilizado nesta atividade é:

1. Abra o endereço do repositório no navegador: https://github.com/dpssouza/primeiro-deploy
2. Selecione o endereço HTTPS abaixo (ou clique em **Code** e copie o endereço):

```text
https://github.com/dpssouza/primeiro-deploy.git
```

Este é o endereço correto do projeto utilizado neste laboratório.

### Passo 4 – Escolher onde guardar o projeto

Para facilitar, vamos guardar o projeto diretamente na pasta pessoal do usuário do Windows. Assim, não precisamos adivinhar se a pasta se chama `Documents`, `Documentos` ou se está dentro do OneDrive.

No terminal integrado do VS Code, execute:

```powershell
cd $HOME
```

Explicação:

- `cd`: muda a pasta atual do terminal.
- `$HOME`: representa a pasta pessoal do usuário do Windows.

O projeto será baixado dentro dessa pasta. Se preferir outro local, o professor poderá orientar como escolher uma pasta diferente.

### Passo 5 – Clonar o repositório

No terminal integrado do VS Code, execute o comando abaixo:

```powershell
git clone https://github.com/dpssouza/primeiro-deploy.git
```

O comando já utiliza o endereço correto do repositório. Não é necessário substituir nenhuma parte.

Entenda o comando:

- `git`: chama o Git.
- `clone`: significa clonar; faz uma cópia do repositório para o computador.
- `https://...git`: endereço do repositório que será copiado.

Aguarde o comando terminar. O Git criará uma pasta com o nome do repositório e colocará os arquivos dentro dela.

### Passo 6 – Entrar na pasta que foi baixada

O Git cria uma pasta chamada `primeiro-deploy`. Entre nela com:

```powershell
cd primeiro-deploy
```

O comando `cd` muda o terminal para dentro da pasta do projeto.

Para conferir onde você está:

```powershell
pwd
```

Para listar os arquivos:

```powershell
dir
```

Você deve localizar a pasta `website`. Se ela não aparecer, entre na pasta correta do projeto ou confira com o professor se o repositório indicado é o certo.

### Passo 7 – Abrir o projeto no VS Code

Se o terminal ainda não estiver aberto na pasta do projeto, entre nela. Depois execute:

```powershell
code .
```

Explicação:

- `code`: chama o Visual Studio Code pelo terminal.
- `.`: significa a pasta atual.

O VS Code abrirá o projeto atual. Se o comando `code` não for reconhecido, use o menu **Arquivo > Abrir Pasta...** e selecione a pasta que foi criada pelo `git clone`.

### Como obter atualizações depois?

Quando o professor atualizar o repositório, você poderá entrar na pasta do projeto e executar:

```powershell
git pull
```

- `git`: chama o Git.
- `pull`: busca as atualizações do repositório remoto e integra essas alterações à cópia que está no seu computador.

**Importante:** execute `git pull` dentro da pasta do projeto. Se você já alterou arquivos localmente, o Git pode avisar que há alterações que precisam ser resolvidas antes de atualizar. Não apague seus arquivos para tentar resolver sem orientação.

### Resumo dos comandos Git usados nesta etapa

| Comando | O que faz? |
|---|---|
| `git --version` | Confere se o Git está instalado e mostra a versão. |
| `git clone ENDERECO` | Baixa uma cópia do repositório para o computador. |
| `cd NOME-DA-PASTA` | Entra na pasta do projeto. |
| `pwd` | Mostra em qual pasta o terminal está. |
| `dir` | Lista arquivos e pastas no Windows. |
| `code .` | Abre a pasta atual no VS Code. |
| `git pull` | Busca e integra atualizações do repositório. |

> **Para este laboratório:** o repositório precisa estar acessível ao aluno. Se for privado, o professor deverá orientar como obter autorização de acesso ao GitHub antes de executar `git clone`.

---

# 3. Conhecer e conferir os arquivos do site

Neste momento, o repositório contém os arquivos do site. **O Dockerfile ainda não existe: ele será criado por você na seção 4. Essa é uma das tarefas principais deste laboratório.**

A estrutura esperada antes de criar o Dockerfile é:

```text
primeiro-deploy/
├── website/
│   ├── index.html
│   ├── assets/
│   │   └── logo-cetep-i.jpg
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
└── README.md
```

Observe:

- `primeiro-deploy/` é a pasta principal criada pelo comando `git clone`.
- `website/` guarda os arquivos que formam o site.
- `Dockerfile` ainda não aparece porque será criado pelo aluno na seção 4.
- `index.html` é a página inicial.
- `assets/` guarda imagens e outros recursos.
- `css/` guarda o arquivo de estilos.
- `js/` guarda o JavaScript.

O nome dos arquivos e das pastas precisa corresponder ao que está escrito no HTML. Em Linux, letras maiúsculas e minúsculas são diferentes: `Logo.jpg` não é o mesmo arquivo que `logo.jpg`.

## 3.1 Conferir a pasta do projeto pelo VS Code

Se você seguiu a seção 2.3, a pasta do projeto já está aberta no VS Code. No painel **Explorer/Explorador**, à esquerda, confira se aparece a pasta `website`.

Agora abra **Terminal > Novo Terminal**. O terminal integrado deverá iniciar na pasta do projeto.

Para conferir o caminho atual, execute:

```powershell
pwd
```

`pwd` significa *print working directory*. Ele mostra o caminho da pasta atual.

Para listar os arquivos e pastas, execute:

```powershell
dir
```

O comando `dir` mostra o conteúdo da pasta atual. Nesta etapa, você deve encontrar `website`. O `Dockerfile` ainda não existe: vamos criá-lo na seção 4.

**Se o terminal abrir em outra pasta:** no VS Code, use **Arquivo > Abrir Pasta...** e selecione novamente a pasta principal do projeto. Não é necessário digitar manualmente o caminho com `cd`.

---

# 4. Criar o Dockerfile: a receita da imagem

## 4.1 O que é Dockerfile?

O `Dockerfile` é um arquivo de texto que contém instruções para o Docker construir uma imagem.

Ele responde a perguntas como:

- Qual imagem pronta será utilizada como ponto de partida?
- Quais arquivos do projeto devem ser copiados?
- Qual porta o serviço utiliza?
- Qual programa deve iniciar quando o container for executado?

O nome do arquivo deve ser exatamente `Dockerfile`, com D maiúsculo e **sem extensão**.

## 4.2 Criar o Dockerfile diretamente no VS Code

O arquivo precisa se chamar exatamente `Dockerfile`, com D maiúsculo e **sem extensão**. Ele deve ficar na pasta principal do projeto, no mesmo nível da pasta `website`.

### Passo 1 – Criar o arquivo

1. No painel **Explorer/Explorador**, à esquerda, localize a pasta principal do projeto.
2. Passe o mouse sobre o nome dessa pasta.
3. Clique no ícone **New File/Novo Arquivo** (folha com sinal de `+`).
4. Digite exatamente `Dockerfile` e pressione `Enter`.
5. O novo arquivo aparecerá no painel Explorer e será aberto no editor.

### Passo 2 – Inserir o conteúdo

Com o arquivo `Dockerfile` aberto, cole exatamente este conteúdo:

```dockerfile
# Imagem base: Nginx com Alpine Linux
FROM nginx:alpine

# Copia os arquivos do site para a pasta pública do Nginx
COPY website/ /usr/share/nginx/html/

# Documenta que o Nginx utiliza a porta 80 dentro do container
EXPOSE 80

# Inicia o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
```

Pressione `Ctrl + S` para salvar.

### Passo 3 – Conferir a estrutura

No painel Explorer, o `Dockerfile` e a pasta `website` devem aparecer lado a lado, dentro da pasta principal do projeto. Para conferir pelo terminal integrado do VS Code, execute:

```powershell
dir
```

A listagem deve mostrar `Dockerfile` e `website`. Se algum deles não aparecer, confira se você abriu a pasta principal correta no VS Code.

**Só avance para o `docker build` quando o arquivo se chamar exatamente `Dockerfile` e estiver ao lado da pasta `website`.**

## 4.3 Explicação de CADA instrução do Dockerfile

### Linha 1 – Comentário

```dockerfile
# Imagem base: Nginx com Alpine Linux
```

- `#` inicia um comentário no Dockerfile.
- Comentário é uma anotação para pessoas que estão lendo o arquivo.
- O Docker não executa o texto que vem depois de `#` nessa linha.
- Comentários ajudam a explicar o objetivo das instruções.

### Linha 2 – FROM

```dockerfile
FROM nginx:alpine
```

`FROM` define a imagem que será usada como ponto de partida para construir a nossa imagem.

Imagine que vamos construir uma casa: antes de colocar os móveis, precisamos de uma estrutura inicial. O `FROM` escolhe essa estrutura.

Agora vamos separar cada parte:

- `FROM`: instrução do Dockerfile que escolhe a imagem base.
- `nginx`: nome da imagem. Ela já contém o servidor web Nginx.
- `:`: separa o nome da imagem da sua tag.
- `alpine`: tag da imagem. Identifica a variante baseada no Alpine Linux, uma distribuição Linux conhecida por ser pequena e leve.

**O que é tag?** Tag é uma identificação associada a uma imagem. Ela ajuda a indicar uma versão ou variante. Neste caso, `alpine` identifica a variante da imagem Nginx que queremos utilizar.

**Por que usar Nginx?** Porque o nosso projeto é um site estático. O Nginx consegue receber solicitações do navegador e entregar arquivos como HTML, CSS, JavaScript e imagens.

### Linha 3 – Linha em branco

A linha vazia apenas separa visualmente as instruções. Ela não executa nenhuma ação e não altera a imagem.

### Linha 4 – COPY

```dockerfile
COPY website/ /usr/share/nginx/html/
```

`COPY` copia arquivos ou pastas do computador onde a imagem está sendo construída para dentro da imagem Docker.

Vamos separar:

- `COPY`: instrução que realiza a cópia.
- `website/`: origem, ou seja, a pasta do nosso projeto que será copiada.
- `/usr/share/nginx/html/`: destino dentro da imagem. É a pasta padrão em que a imagem oficial do Nginx procura os arquivos do site.

**O que significa a barra `/`?**

No início de um caminho Linux, `/` representa a raiz do sistema de arquivos. Portanto, `/usr/share/nginx/html/` é um caminho absoluto dentro do container.

**Por que existe um espaço entre os dois caminhos?**

Porque o comando precisa saber duas coisas: primeiro, de onde copiar; segundo, para onde copiar.

**O que acontece na prática?**

Os arquivos que estão em `website/` no projeto são colocados dentro de `/usr/share/nginx/html/` na imagem. Assim, quando o container iniciar, o Nginx encontrará o `index.html` e poderá entregar o site.

### Linha 5 – Linha em branco

Serve apenas para organizar e facilitar a leitura.

### Linha 6 – EXPOSE

```dockerfile
EXPOSE 80
```

`EXPOSE` documenta qual porta o serviço dentro do container utiliza.

Separando:

- `EXPOSE`: instrução do Dockerfile que registra a porta utilizada pela aplicação.
- `80`: número da porta. O Nginx utiliza normalmente a porta 80 para receber conexões HTTP.

**Atenção: EXPOSE NÃO PUBLICA A PORTA NA INTERNET!**

Essa é uma diferença muito importante.

`EXPOSE 80` informa que o serviço utiliza a porta 80 dentro do container. Para permitir que o computador ou a internet acesse essa porta, usaremos `-p` no comando `docker run`.

### Linha 7 – Linha em branco

Apenas organização visual.

### Linha 8 – CMD

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

Esta instrução define o comando padrão que será executado quando um container for iniciado a partir da imagem, desde que esse comando não seja substituído na inicialização.

Vamos entender cada elemento:

- `CMD`: instrução do Dockerfile que define o comando padrão do container.
- `[` e `]`: indicam que estamos usando uma lista de elementos no formato JSON, também chamada de *exec form*.
- `"nginx"`: é o programa que queremos executar. Nesse caso, o servidor web Nginx.
- `,`: separa um elemento do próximo dentro da lista.
- `"-g"`: é uma opção do programa Nginx. Ela permite fornecer uma diretiva de configuração pela linha de comando.
- `"daemon off;"`: é o valor passado para a opção `-g`.
- `;`: encerra a diretiva de configuração do Nginx.
- `"`: delimita cada texto da lista.

**O que significa `daemon off;`?**

Normalmente, um servidor pode iniciar em segundo plano, como um serviço independente. Porém, o Docker precisa acompanhar um processo principal em execução dentro do container.

A expressão `daemon off;` diz ao Nginx para não se colocar em segundo plano. Ele permanece em primeiro plano.

**Por que isso é importante?**

O Docker considera o processo principal como referência para saber se o container continua em execução. Se o processo principal termina, o container também encerra.

Por isso, usamos:

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

Assim, o Nginx permanece em primeiro plano e o container continua ativo enquanto o servidor estiver funcionando.

**Por que usamos colchetes e aspas?**

Essa é a forma exec do `CMD`. Cada item é um argumento separado:

1. O programa: `nginx`.
2. A opção: `-g`.
3. O valor da opção: `daemon off;`.

O Docker executa o programa diretamente, sem precisar iniciar um shell para interpretar a linha.

### Resumo do Dockerfile

| Instrução | O que faz? | Neste projeto |
|---|---|---|
| `FROM` | Escolhe a imagem base | Usa Nginx com Alpine |
| `COPY` | Copia arquivos para a imagem | Copia o site para a pasta pública do Nginx |
| `EXPOSE` | Documenta a porta utilizada | Informa a porta 80 |
| `CMD` | Define o comando padrão de inicialização | Inicia o Nginx em primeiro plano |
| `#` | Adiciona comentário | Explica o arquivo para quem está lendo |

## 4.4 Conferir se o Dockerfile foi criado corretamente

Execute:

```powershell
Get-ChildItem -Force | Select-Object Name
```

Procure exatamente estes nomes:

```text
Dockerfile
website
```

O nome precisa ser exatamente `Dockerfile`, sem extensão.

Agora execute:

```powershell
Test-Path .\Dockerfile
```

O resultado esperado é `True`. Se aparecer `False`, confira se você está na pasta correta e se o arquivo foi criado com o nome exato `Dockerfile`.

**Só avance para o `docker build` quando o nome estiver correto e `Dockerfile` e `website` estiverem no mesmo nível da pasta.**

---

# 5. Construir a imagem Docker

Agora que temos o Dockerfile, vamos pedir ao Docker para construir a imagem.

Na pasta principal do projeto, execute:

```powershell
docker build -t laboratorio-cetepi:v1 .
```

## 5.1 Explicação de cada parte do comando

- `docker`: chama o programa Docker.
- `build`: significa construir. Aqui, vamos construir uma imagem.
- `-t`: abreviação de *tag*. Permite atribuir um nome e uma identificação à imagem.
- `laboratorio-cetepi`: nome escolhido para a imagem.
- `:`: separa o nome da imagem da tag.
- `v1`: tag escolhida para identificar a versão 1.
- `.`: ponto que representa o diretório atual. É o contexto de construção, ou seja, a pasta que o Docker poderá utilizar para encontrar o Dockerfile e os arquivos necessários.

**Por que o ponto é importante?** Porque o Docker precisa saber em qual pasta procurar o Dockerfile e os arquivos usados pelo `COPY`. Se você executar o comando em outra pasta, poderá receber um erro ou construir a imagem com arquivos diferentes dos esperados.

## 5.2 O que acontece durante a construção?

O Docker lê o Dockerfile de cima para baixo e executa suas instruções para montar a imagem:

1. Obtém a imagem base `nginx:alpine`, se ainda não estiver disponível localmente.
2. Copia a pasta `website/` para o diretório público do Nginx.
3. Registra a informação da porta 80.
4. Guarda o comando padrão que será usado quando o container iniciar.

Ao terminar, o Docker informa que a imagem foi construída.

# 6. Executar e testar o container no computador

Antes de criar a máquina virtual na AWS, vamos executar a imagem no próprio computador. Assim, podemos verificar se o Nginx inicia e se o site abre corretamente no navegador.

## 6.1 Conferir se a imagem foi criada

A construção terminou sem apresentar erros? Então o Docker conseguiu criar a imagem. Para conferir se ela está disponível, execute no terminal integrado do VS Code:

```powershell
docker images
```

- `docker`: chama o programa Docker.
- `images`: lista as imagens disponíveis no computador.

Procure uma linha semelhante a:

```text
REPOSITORY           TAG
laboratorio-cetepi   v1
```

Se aparecer `laboratorio-cetepi` com a tag `v1`, podemos iniciar um container usando essa imagem.

## 6.2 Executar o container localmente

No terminal integrado do VS Code, ainda na pasta do projeto, execute:

```powershell
docker run -d --name laboratorio-cetepi-local -p 80:80 laboratorio-cetepi:v1
```

Vamos entender cada parte:

- `docker`: chama o programa Docker.
- `run`: cria e inicia um container a partir de uma imagem.
- `-d`: executa o container em segundo plano, sem prender o terminal.
- `--name laboratorio-cetepi-local`: define o nome do container. Usamos o sufixo `-local` para deixar claro que este container está no computador do aluno.
- `-p 80:80`: encaminha a porta 80 do computador para a porta 80 do container.
- `laboratorio-cetepi:v1`: nome e tag da imagem que será utilizada para criar o container.

**Entenda o mapeamento `80:80`:** o primeiro número (`80`) é a porta do computador. O segundo número (`80`) é a porta dentro do container, onde o Nginx está escutando.

Se o comando retornar um código longo, formado por letras e números, isso indica que o Docker criou o container.

## 6.3 Conferir se o container está em execução

Execute:

```powershell
docker ps
```

- `docker`: chama o programa Docker.
- `ps`: lista os containers que estão em execução.

Procure o container `laboratorio-cetepi-local`. Na coluna `PORTS`, deve aparecer algo semelhante a `0.0.0.0:80->80/tcp`. Isso indica que a porta 80 do computador foi encaminhada para a porta 80 do container.

Se o container não aparecer, execute `docker ps -a` para listar também os containers parados.

## 6.4 Abrir o site no navegador

Abra o navegador no próprio computador e digite o endereço:

```text
http://localhost
```

`localhost` significa o próprio computador. Como publicamos a porta 80 do computador, o navegador consegue acessar o Nginx que está dentro do container.

**Resultado esperado:** a página inicial do projeto deve aparecer no navegador. Confira se o texto, as imagens, o CSS e os demais elementos do site estão sendo exibidos corretamente.

> Se a página não abrir, confira se o Docker Desktop está em execução, se o container aparece em `docker ps` e se o endereço foi digitado exatamente como `http://localhost`. A seção de solução de problemas também poderá ajudar.

## 6.5 Consultar os logs, se necessário

Se o site não abrir ou se quiser verificar as mensagens do Nginx, execute:

```powershell
docker logs laboratorio-cetepi-local
```

- `logs`: mostra as mensagens registradas pelo container.
- `laboratorio-cetepi-local`: é o nome do container que queremos consultar.

## 6.6 Parar o container local

Depois de confirmar que o site abriu corretamente, pare o container local:

```powershell
docker stop laboratorio-cetepi-local
```

- `stop`: solicita que o container seja encerrado.
- `laboratorio-cetepi-local`: identifica qual container será parado.

A imagem `laboratorio-cetepi:v1` continuará salva no computador. Na próxima etapa, vamos preparar a EC2 e enviar os arquivos do projeto para construir e executar a aplicação no servidor.

**Importante:** só começaremos a configuração da AWS depois de concluir a construção da imagem e o teste local do site.

# 7. Criar a máquina virtual na AWS (EC2)

> Se o professor já disponibilizou uma EC2 para a turma, não crie outra. Siga a orientação do professor. Criar recursos adicionais pode gerar custos.

## 7.1 Entrar no console AWS

1. Acesse https://console.aws.amazon.com/.
2. Entre na sua conta.
3. Na busca dos serviços, digite `EC2`.
4. Clique no serviço EC2.
5. Confira se está na região indicada pelo professor.

## 7.2 Criar a instância

1. Clique em **Launch instance**.
2. Em **Name**, escreva `laboratorio-cetepi`.
3. Em **Application and OS Images (AMI)**, selecione **Ubuntu Server LTS**, conforme orientação do professor.
4. Escolha o tipo de instância indicado pelo professor e confira os possíveis custos.
5. Em **Key pair**, crie ou selecione um par de chaves.
6. Se criar um novo par, escolha `.pem` para utilizar com OpenSSH no Windows.
7. Baixe a chave privada e guarde-a em local seguro.

**O que é AMI?** AMI significa *Amazon Machine Image*. É um modelo utilizado para iniciar uma instância EC2. Nesse laboratório, a AMI contém o sistema operacional Ubuntu.

**O que é Key Pair?** É um par de chaves utilizado para autenticar o acesso SSH. A chave privada `.pem` fica com você. Não envie essa chave a outras pessoas.

## 7.3 Configurar o Security Group

O Security Group é como um firewall virtual da EC2. Ele controla quais conexões podem chegar ao servidor.

Crie as regras de entrada:

| Tipo | Protocolo | Porta | Origem | Para que serve |
|---|---|---:|---|---|
| SSH | TCP | 22 | Meu IP | Permite administrar a EC2 pelo terminal |

Explicando os campos:

- **Tipo:** categoria da regra, por exemplo SSH.
- **Protocolo:** forma de comunicação. Nesta prática usamos TCP.
- **Porta:** número do serviço que será acessado.
- **Origem:** de onde a conexão pode partir.
- **Meu IP:** limita o SSH ao endereço de internet que você está utilizando no momento.
**Importante:** nesta etapa, configure somente a regra SSH. As demais regras de acesso serão trabalhadas posteriormente durante a aula.

## 7.4 Lançar a instância

1. Revise as configurações.
2. Clique em **Launch instance**.
3. Aguarde o estado ficar como `Running`.
4. Aguarde também as verificações de status da instância.

## 7.5 Copiar o IP público

Selecione a instância e localize **Public IPv4 address**.

Exemplo fictício:

```text
54.123.45.67
```

O endereço real será diferente. Não copie o endereço do exemplo: use o IP da sua própria instância.

---

# 8. Conectar ao Ubuntu usando SSH

## 8.1 O que é SSH?

SSH significa *Secure Shell*. É uma forma segura de acessar o terminal de outro computador pela rede. Neste laboratório, vamos acessar remotamente a máquina EC2, que utiliza Ubuntu.

**Onde executar os comandos:** no Windows, abra o VS Code e escolha **Terminal > Novo Terminal**. O terminal integrado deve estar configurado para **PowerShell**. Os comandos de conexão e os comandos `icacls` desta seção são executados nesse terminal local do Windows. Depois que a conexão for estabelecida, o prompt mudará e você estará no terminal remoto do Ubuntu.

## 8.2 Localizar a chave privada `.pem`

Encontre o arquivo `.pem` que foi baixado quando o par de chaves foi criado na AWS. Por exemplo, ele pode estar em:

```text
C:\loja.pem
```

A chave privada é uma credencial de acesso ao servidor. **Não envie o arquivo `.pem` para o GitHub, não compartilhe com outras pessoas e não publique seu conteúdo.**

## 8.3 Tentar a conexão SSH

No terminal integrado do VS Code (PowerShell), execute o comando abaixo, substituindo o IP pelo IPv4 público da sua instância EC2:

```powershell
ssh -i "C:\loja.pem" ubuntu@IP_PUBLICO_DA_EC2
```

Entenda cada parte:

- `ssh`: inicia uma conexão segura com outro computador.
- `-i`: informa qual arquivo de identidade (chave privada) será usado para autenticar o acesso.
- `"C:\loja.pem"`: caminho completo onde está armazenada a chave privada. Se o arquivo estiver em outra pasta, ajuste o caminho.
- `ubuntu`: usuário padrão utilizado para acessar uma instância EC2 com Ubuntu.
- `@`: separa o nome do usuário do endereço do servidor.
- `IP_PUBLICO_DA_EC2`: endereço IPv4 público da sua instância. Substitua pelo endereço real exibido no console da AWS.

Exemplo fictício de IP:

```powershell
ssh -i "C:\loja.pem" ubuntu@54.123.45.67
```

### Se aparecer erro de permissões da chave no Windows

Em alguns computadores, o SSH não aceita a chave porque as permissões do arquivo permitem acesso a outros usuários. As mensagens podem incluir:

- `UNPROTECTED PRIVATE KEY FILE`;
- `Bad permissions`;
- `Permissions for ... are too open`.

Para corrigir, continue no **terminal integrado do VS Code configurado para PowerShell**. Execute os comandos abaixo, um de cada vez, usando o caminho correto da sua chave. Neste exemplo, a chave está em `C:\loja.pem`.

**Comando 1:**

```powershell
icacls "C:\loja.pem" /reset
```

- `icacls`: ferramenta do Windows para consultar e alterar as permissões de arquivos e pastas.
- `/reset`: redefine as permissões do arquivo para as permissões herdadas do local onde ele está salvo.

**Comando 2:**

```powershell
icacls "C:\loja.pem" /grant:r "$($env:USERNAME):(R)"
```

- `/grant:r`: concede a permissão indicada e substitui permissões explícitas anteriores para esse usuário.
- `$($env:USERNAME)`: representa o nome do usuário que está conectado ao Windows.
- `(R)`: concede permissão de leitura (*Read*), necessária para o SSH ler a chave.

**Comando 3:**

```powershell
icacls "C:\loja.pem" /inheritance:r
```

- `/inheritance:r`: desativa a herança de permissões e remove as permissões herdadas. Isso evita que outros usuários recebam acesso à chave por herança.

Depois de executar os três comandos, tente novamente a conexão:

```powershell
ssh -i "C:\loja.pem" ubuntu@IP_PUBLICO_DA_EC2
```

Lembre-se de substituir `IP_PUBLICO_DA_EC2` pelo IPv4 público real da instância.

**Atenção:** aplique esses comandos somente ao arquivo da chave privada correta. Não altere permissões de outros arquivos por tentativa. Se o erro continuar, confira se o caminho da chave está correto, se a chave corresponde ao par escolhido na criação da EC2 e se o usuário SSH é `ubuntu`.

### Se estiver usando Linux ou macOS

Em Linux ou macOS, a correção usual é restringir a leitura da chave ao proprietário:

```bash
chmod 400 caminho/para/sua-chave.pem
ssh -i "caminho/para/sua-chave.pem" ubuntu@IP_PUBLICO_DA_EC2
```

- `chmod`: altera as permissões de um arquivo.
- `400`: permite que somente o proprietário leia o arquivo; os demais usuários não recebem permissões.
- `ssh -i`: inicia a conexão utilizando a chave indicada.

## 8.4 Confirmar a primeira conexão

Na primeira conexão, o SSH pode exibir uma mensagem perguntando se você confia na identidade do servidor. Confira se o IP exibido corresponde à sua instância EC2. Se estiver correto, digite `yes` e pressione `Enter`.

Quando a conexão funcionar, o prompt será parecido com:

```text
ubuntu@ip-172-31-xx-xx:~$
```

Isso indica que você está no terminal do Ubuntu da EC2. A partir desse momento, os comandos Linux das próximas seções devem ser executados nessa sessão remota, e não no PowerShell local do Windows.

Para encerrar a conexão e voltar ao terminal local do VS Code, execute:

```bash
exit
```

- `exit`: encerra a sessão SSH e retorna ao terminal local.

# 9. Instalar Docker no Ubuntu

Todos os comandos desta seção devem ser digitados no terminal SSH da EC2.

## 9.1 Atualizar a lista de pacotes

```bash
sudo apt update
```

Explicação:

- `sudo`: executa o comando com privilégios administrativos.
- `apt`: gerenciador de pacotes do Ubuntu. É utilizado para instalar e administrar programas.
- `update`: atualiza a lista de pacotes disponíveis nos repositórios configurados.

**Importante:** `apt update` atualiza a lista de informações dos pacotes. Não significa, por si só, que todos os programas foram atualizados.

## 9.2 Instalar o Docker

```bash
sudo apt install -y docker.io
```

Explicação:

- `sudo`: executa com privilégios administrativos.
- `apt`: gerenciador de pacotes.
- `install`: indica que queremos instalar um programa.
- `-y`: responde automaticamente “sim” às perguntas de confirmação.
- `docker.io`: nome do pacote Docker disponível nos repositórios do Ubuntu.

Aguarde a instalação terminar.

## 9.3 Iniciar o serviço e habilitá-lo no boot

```bash
sudo systemctl enable --now docker
```

Explicação:

- `sudo`: executa com permissão administrativa.
- `systemctl`: ferramenta utilizada para controlar serviços do Linux.
- `enable`: configura o serviço para iniciar automaticamente quando o sistema ligar.
- `--now`: além de habilitar para o próximo início, inicia o serviço imediatamente.
- `docker`: nome do serviço que será iniciado.

## 9.4 Conferir a versão

```bash
sudo docker --version
```

- `docker`: chama o Docker.
- `--version`: mostra a versão instalada.

## 9.5 Conferir se o serviço está ativo

```bash
sudo systemctl status docker --no-pager
```

Explicação:

- `status`: consulta o estado do serviço.
- `docker`: serviço que queremos verificar.
- `--no-pager`: mostra o resultado diretamente no terminal, sem abrir um visualizador de texto.

Procure `active (running)`. Isso indica que o serviço Docker está ativo.

## 9.6 Por que usamos sudo?

O Linux protege operações administrativas. Instalar programas e controlar serviços exige permissões elevadas. O `sudo` executa o comando com essas permissões, desde que o usuário esteja autorizado.

## 9.7 Opcional: executar Docker sem digitar sudo

Em laboratório, pode ser conveniente adicionar o usuário `ubuntu` ao grupo `docker`:

```bash
sudo usermod -aG docker ubuntu
```

Explicação:

- `usermod`: altera configurações de uma conta de usuário.
- `-a`: significa *append*, ou seja, acrescentar o usuário a um grupo sem remover suas outras associações.
- `-G`: informa os grupos aos quais o usuário será associado.
- `docker`: nome do grupo.
- `ubuntu`: usuário que será adicionado.

Depois, encerre a sessão SSH:

```bash
exit
```

Conecte-se novamente e teste:

```bash
docker ps
```

**Aviso de segurança:** fazer parte do grupo `docker` concede privilégios muito elevados, que podem permitir ações equivalentes às de administrador. Em servidores compartilhados ou de produção, siga a política de segurança definida pelo responsável. Se não tiver certeza, continue utilizando `sudo docker`.

---

# 10. Enviar os arquivos do Windows para a EC2

O site e o `Dockerfile` estão no computador, mas o servidor EC2 ainda precisa receber esses arquivos. Nesta primeira prática, vamos transferi-los com SCP. O Git foi utilizado para obter o projeto do GitHub; o SCP será utilizado para copiar a versão que você preparou (incluindo o Dockerfile criado na aula) para a EC2.

Você pode escolher uma das opções:

- **Opção A (recomendada):** usar o comando SCP no terminal integrado do VS Code.
- **Opção B:** usar WinSCP, com interface gráfica.

Não precisa utilizar as duas.

## 10.1 Opção A – Transferir pelo SCP

SCP significa *Secure Copy*. É um comando que copia arquivos entre computadores utilizando SSH.

### Passo A – Abrir o terminal na pasta do projeto

No VS Code, confirme que a pasta principal do projeto está aberta. Clique em **Terminal > Novo Terminal**.

O terminal integrado deverá abrir na pasta do projeto. Execute:

```powershell
pwd
dir
```

A listagem deve conter `Dockerfile` e `website`. Se não contiver, abra a pasta correta pelo menu **Arquivo > Abrir Pasta...**.

### Passo B – Criar uma pasta no servidor

Execute no terminal integrado do VS Code (Windows):

```powershell
ssh -i "C:\caminho\da\chave.pem" ubuntu@IP_PUBLICO_DA_EC2 "mkdir -p ~/laboratorio-cetepi"
```

Explicação:

- `ssh`: conecta ao servidor.
- `-i`: informa o arquivo da chave privada.
- `ubuntu@IP_PUBLICO_DA_EC2`: usuário e endereço do servidor.
- `"mkdir -p ~/laboratorio-cetepi"`: comando que será executado no Ubuntu remoto.
- `mkdir`: cria uma pasta.
- `-p`: cria a pasta sem apresentar erro caso ela já exista e também cria diretórios intermediários quando necessário.
- `~`: representa a pasta pessoal do usuário conectado. Para `ubuntu`, normalmente é `/home/ubuntu`.
- `laboratorio-cetepi`: nome da pasta que receberá os arquivos.

### Passo C – Copiar o Dockerfile e a pasta website

Ainda no terminal integrado do VS Code (Windows), execute:

```powershell
scp -i "C:\caminho\da\chave.pem" -r Dockerfile website ubuntu@IP_PUBLICO_DA_EC2:~/laboratorio-cetepi/
```

Explicação de cada parte:

- `scp`: inicia a cópia segura de arquivos.
- `-i`: indica a chave privada utilizada para autenticar.
- `"C:\caminho\da\chave.pem"`: caminho da chave privada.
- `-r`: significa *recursive*. Permite copiar pastas e todo o seu conteúdo.
- `Dockerfile`: primeiro item que será enviado.
- `website`: pasta inteira que será enviada.
- `ubuntu@IP_PUBLICO_DA_EC2`: usuário e endereço do destino.
- `:`: separa o endereço remoto do caminho de destino.
- `~/laboratorio-cetepi/`: pasta de destino no servidor.

**Atenção:** esses comandos são executados no terminal integrado do VS Code no Windows. Não digite os caminhos do Windows dentro do terminal Ubuntu da EC2.

## 10.2 Opção B – Transferir usando WinSCP

1. Abra o WinSCP.
2. Escolha o protocolo **SFTP**.
3. Em **Host name**, informe o IP público da EC2.
4. Em **Port number**, informe `22`.
5. Em **User name**, digite `ubuntu`.
6. Configure a autenticação com a chave privada `.pem`. Dependendo da versão, o WinSCP pode solicitar a conversão para `.ppk`.
7. Conecte-se.
8. No painel do computador, localize `Dockerfile` e a pasta `website`.
9. No painel remoto, abra `/home/ubuntu/laboratorio-cetepi`.
10. Arraste `Dockerfile` e `website` para a pasta remota.

## 10.3 Conferir se os arquivos chegaram

Volte ao terminal SSH da EC2 e execute:

```bash
cd ~/laboratorio-cetepi
```

- `cd`: entra em uma pasta.
- `~`: pasta pessoal do usuário `ubuntu`.
- `/laboratorio-cetepi`: pasta criada para receber o projeto.

Agora execute:

```bash
ls -la
```

Explicação:

- `ls`: lista arquivos e pastas.
- `-l`: mostra detalhes, como permissões, proprietário, tamanho e data.
- `-a`: inclui também arquivos ocultos.

Você deve encontrar:

```text
Dockerfile
website
```

Confira o conteúdo da pasta:

```bash
ls -la website
```

Se os arquivos não estiverem no local correto, corrija a transferência antes de continuar.

## 10.4 Ajustar as permissões dos arquivos do site

Antes de construir a imagem na EC2, vamos garantir que o Nginx consiga acessar os arquivos de HTML, CSS, JavaScript e imagens.

No Linux, as permissões de uma pasta podem impedir que o servidor web acesse seu conteúdo. Por exemplo, a permissão `drwx------` permite o acesso somente ao proprietário da pasta. Se isso acontecer com as pastas `css`, `js` ou `assets`, o HTML poderá abrir, mas o navegador não conseguirá carregar os estilos, scripts ou imagens.

Na EC2, ainda dentro de `~/laboratorio-cetepi`, execute:

```bash
sudo chmod -R a+rX website/
```

Entenda cada parte:

- `sudo`: executa o comando com privilégios administrativos.
- `chmod`: altera as permissões de arquivos e pastas.
- `-R`: aplica a alteração recursivamente, incluindo as subpastas.
- `a`: significa *all* (todos os usuários).
- `+r`: adiciona permissão de leitura.
- `X`: adiciona permissão de acesso/execução aos diretórios e mantém a execução em arquivos que já tinham essa permissão.
- `website/`: indica a pasta do site que receberá o ajuste.

Esse comando permite que o Nginx leia os arquivos e acesse as pastas necessárias. Ele não concede permissão de escrita a todos os usuários.

Para conferir as permissões, execute:

```bash
ls -la website
```

As pastas do site devem permitir leitura e acesso por outros usuários, e não apresentar somente permissões do proprietário, como `drwx------`.

---

# 11. Construir a imagem na EC2

Agora estamos no Ubuntu da AWS, dentro da pasta do projeto.

Confirme a localização:

```bash
pwd
```

O resultado deve ser parecido com:

```text
/home/ubuntu/laboratorio-cetepi
```

Construa a imagem:

```bash
sudo docker build -t laboratorio-cetepi:v1 .
```

Explicação:

- `sudo`: executa com privilégios administrativos.
- `docker`: chama o Docker.
- `build`: constrói uma imagem.
- `-t`: define o nome e a tag da imagem.
- `laboratorio-cetepi`: nome da imagem.
- `:v1`: tag que identifica a versão 1.
- `.`: usa a pasta atual como contexto de construção.

Aguarde a conclusão. Depois confira:

```bash
sudo docker images
```

Procure a imagem `laboratorio-cetepi` com a tag `v1`.

---

# 12. Executar o container na EC2

## 12.1 Iniciar o container

A imagem `laboratorio-cetepi:v1` já foi construída na etapa anterior. Agora vamos utilizá-la para criar e iniciar um container.

No terminal SSH da EC2, execute:

```bash
sudo docker run -d --name laboratorio-cetepi -p 80:80 laboratorio-cetepi:v1
```

Agora vamos entender cada parte do comando:

- `sudo`: executa o comando com privilégios administrativos.
- `docker`: chama o programa Docker.
- `run`: cria e inicia um novo container a partir de uma imagem.
- `-d`: executa o container em segundo plano (*detached*), deixando o terminal livre.
- `--name laboratorio-cetepi`: define `laboratorio-cetepi` como nome do container.
- `-p 80:80`: publica a porta 80 da EC2 e encaminha as conexões para a porta 80 dentro do container.
- `laboratorio-cetepi:v1`: indica a imagem que será utilizada. `laboratorio-cetepi` é o nome da imagem e `v1` é sua tag.

**Atenção:** o comando cria um container a partir da imagem existente. Ele não constrói uma nova imagem. A construção foi feita na etapa 11 com `docker build`.

## 12.2 Entender o mapeamento de portas `80:80`

```text
-p 80:80
   |  |
   |  +---- Porta 80 dentro do container (Nginx)
   |
   +------- Porta 80 da EC2 (servidor)
```

O primeiro `80` representa a porta da EC2. O segundo `80` representa a porta dentro do container, onde o Nginx recebe as solicitações.

Quando o visitante acessar o IP público da EC2 pelo navegador, o Docker encaminhará a conexão para o Nginx que está dentro do container.

**Importante para a atividade:** neste momento, a regra de entrada HTTP (porta 80) ainda não foi adicionada ao Security Group. Portanto, mesmo que o container esteja em execução, o acesso pelo navegador poderá não funcionar. A liberação dessa porta será feita posteriormente, durante a atividade de diagnóstico em sala.

## 12.3 Conferir se o container está em execução

Execute:

```bash
sudo docker ps
```

Esse comando lista os containers em execução.

Procure:

- nome: `laboratorio-cetepi`;
- status: `Up`;
- portas: algo semelhante a `0.0.0.0:80->80/tcp`.

O trecho `0.0.0.0:80->80/tcp` indica que a porta 80 da EC2 está publicada e encaminhada para a porta 80 do container.

Para listar também containers parados, execute:

```bash
sudo docker ps -a
```

A opção `-a` significa *all* (todos).

## 12.4 Consultar os logs

Para visualizar as mensagens registradas pelo container, execute:

```bash
sudo docker logs laboratorio-cetepi
```

- `logs`: mostra as mensagens registradas pelo container.
- `laboratorio-cetepi`: identifica o container que queremos consultar.

Para acompanhar continuamente as novas mensagens:

```bash
sudo docker logs -f laboratorio-cetepi
```

- `-f`: significa *follow* (acompanhar).
- `Ctrl + C`: encerra a visualização dos logs. Isso não para o container.

---

# 13. Abrir o site pela internet

No navegador do computador, digite:

```text
http://IP_PUBLICO_DA_EC2
```

Exemplo fictício:

```text
http://54.123.45.67
```

Substitua pelo IP público da sua EC2.

Se a página do CETEP-I aparecer, o deploy foi realizado.

## 13.1 O que conferir no site?

- A logomarca aparece?
- O menu funciona?
- A seção **O laboratório** abre?
- A seção **Tecnologias** apresenta as ferramentas?
- A seção **Status** abre?
- As imagens carregam?
- O CSS está aplicado?
- Os botões e interações funcionam?

## 13.2 Testar a resposta do servidor pelo próprio Ubuntu

Na EC2, execute:

```bash
curl -I http://localhost
```

Explicação:

- `curl`: ferramenta de linha de comando para realizar solicitações a endereços de rede.
- `-I`: solicita apenas os cabeçalhos da resposta HTTP.
- `http://`: protocolo utilizado.
- `localhost`: a própria máquina EC2.
- `localhost` sem número de porta utiliza a porta HTTP padrão 80.

Se o serviço responder com um código HTTP como `200 OK`, é um sinal de que o Nginx está entregando a resposta. Outros códigos podem indicar redirecionamento ou algum problema que precisa ser investigado.

## 13.3 Sobre o painel Status do site

O painel Status da página é demonstrativo e estático. Ele apresenta informações explicativas sobre a arquitetura do laboratório, mas não consulta automaticamente o estado real da EC2, do Docker ou do Nginx.

Para consultar o estado real do ambiente, utilize os comandos no terminal da EC2:

```bash
sudo docker ps
```

Lista containers em execução.

```bash
sudo systemctl status docker --no-pager
```

Consulta se o serviço Docker está ativo.

```bash
curl -I http://localhost
```

Testa a resposta HTTP do site pela própria EC2.

---

# 14. Como atualizar o site depois de fazer alterações

Se você alterar o HTML, CSS, JavaScript ou as imagens no computador, o container que já está executando não recebe essas mudanças automaticamente.

Para publicar uma nova versão, será necessário:

1. Enviar os arquivos atualizados para a EC2.
2. Construir uma nova imagem.
3. Parar e remover o container antigo.
4. Criar um novo container usando a nova imagem.

## 14.1 Enviar os arquivos atualizados

Utilize novamente SCP ou WinSCP, conforme explicado na Fase 10. Envie o `Dockerfile` e a pasta `website` para:

```text
/home/ubuntu/laboratorio-cetepi
```

## 14.2 Ajustar as permissões e construir uma nova imagem

Depois de enviar os arquivos atualizados, repita o ajuste de permissões na EC2. Isso evita que novos arquivos ou pastas voltem a impedir o acesso do Nginx:

```bash
sudo chmod -R a+rX website/
```

Em seguida, na EC2, entre na pasta do projeto:

```bash
cd ~/laboratorio-cetepi
```

Depois construa a nova imagem:

```bash
sudo docker build -t laboratorio-cetepi:v2 .
```

Agora usamos `v2` para identificar a segunda versão.

A imagem antiga `v1` continua existindo. A nova imagem terá a tag `v2`.

## 14.3 Parar o container antigo

```bash
sudo docker stop laboratorio-cetepi
```

`stop` solicita que o container seja parado.

## 14.4 Remover o container antigo

```bash
sudo docker rm laboratorio-cetepi
```

`rm` remove o container que foi parado.

**Importante:** esses comandos não apagam a pasta do projeto e não removem automaticamente as imagens `v1` ou `v2`.

## 14.5 Criar o container com a nova imagem

```bash
sudo docker run -d --name laboratorio-cetepi --restart unless-stopped -p 80:80 laboratorio-cetepi:v2
```

Agora o container será criado usando a imagem `v2`.

Confira:

```bash
sudo docker ps
```

Atualize o navegador com `Ctrl + F5` para solicitar os arquivos novamente, evitando que o navegador mostre uma cópia antiga armazenada em cache.

---

# 15. Solução de problemas

## Problema 0 – `failed to read dockerfile` ou `open Dockerfile: no such file or directory`

Esse erro significa que o Docker não encontrou um arquivo chamado exatamente `Dockerfile` na pasta em que o comando `docker build` foi executado.

No VS Code, confira o painel Explorer e verifique se existe um arquivo chamado exatamente `Dockerfile` na pasta principal do projeto. Se ele não existir, crie-o seguindo a seção 4.2.

Depois, no terminal integrado do VS Code, execute:

```powershell
dir
```

A listagem deve mostrar `Dockerfile` e `website`. Se o arquivo estiver correto e o erro continuar, execute `pwd` para conferir o caminho atual. Você precisa estar na pasta principal do projeto, aquela que contém os dois itens.

**Não execute `docker build` dentro da pasta `website`.** Execute-o na pasta principal do projeto.

## Problema 1 – `docker` não foi encontrado

Possível causa: Docker não foi instalado corretamente.

Verifique:

```bash
sudo systemctl status docker --no-pager
```

Se necessário, inicie:

```bash
sudo systemctl enable --now docker
```

## Problema 2 – `Cannot connect to the Docker daemon`

O cliente Docker não está conseguindo conversar com o serviço Docker.

Verifique:

```bash
sudo systemctl status docker --no-pager
```

Se estiver parado:

```bash
sudo systemctl start docker
```

## Problema 3 – `Permission denied`

Tente executar o comando com `sudo`:

```bash
sudo docker ps
```

Se quiser executar sem `sudo`, siga as orientações da seção 9.7 e abra uma nova sessão SSH.

## Problema 4 – O navegador não abre o site

Verifique:

1. A EC2 está ligada?
2. O IP público está correto?
3. Você digitou o endereço `http://IP_PUBLICO_DA_EC2` sem acrescentar uma porta?
4. O Security Group permite entrada TCP na porta 80?
5. O container está em execução?

Confira:

```bash
sudo docker ps
```

Se não aparecer, verifique também os containers parados:

```bash
sudo docker ps -a
```

## Problema 5 – A porta 80 já está em uso

Pode existir outro container ou serviço utilizando a porta.

Confira:

```bash
sudo docker ps
```

Não remova containers desconhecidos. Se a EC2 for compartilhada, peça orientação ao professor.

## Problema 6 – O container encerra logo após iniciar

Consulte:

```bash
sudo docker logs laboratorio-cetepi
```

Confira também se o Dockerfile está correto e se a pasta `website` contém o arquivo `index.html`.

## Problema 7 – A página abre sem CSS, JavaScript ou imagens

Confira os arquivos enviados:

```bash
ls -R ~/laboratorio-cetepi/website
```

`ls` lista arquivos e `-R` percorre as subpastas recursivamente.

Lembre-se: Linux diferencia letras maiúsculas e minúsculas. `Style.css` e `style.css` são nomes diferentes.

## Problema 8 – SSH não conecta

Verifique:

- IP público correto;
- instância EC2 ligada;
- regra TCP 22 no Security Group;
- origem SSH configurada para seu IP;
- usuário `ubuntu`;
- caminho correto da chave `.pem`.

Não compartilhe sua chave privada.

---

# 16. Segurança e cuidados importantes

- Nunca compartilhe a chave privada `.pem`.
- Não publique senhas, tokens ou credenciais em repositórios ou mensagens.
- Mantenha a porta SSH (22) restrita ao seu IP sempre que possível.
- Abra somente as portas necessárias.
- Não execute comandos de remoção sem saber o que eles fazem.
- Não use `docker system prune`, `docker volume prune` ou comandos semelhantes sem orientação: eles podem remover recursos que você ainda precisa.
- Não desligue nem exclua uma EC2 compartilhada sem autorização do professor.
- Confira os custos dos recursos AWS utilizados.

---

# 17. Limpeza do laboratório

Faça a limpeza somente quando o professor autorizar e depois de confirmar que a atividade terminou.

Para parar o container:

```bash
sudo docker stop laboratorio-cetepi
```

Para remover o container:

```bash
sudo docker rm laboratorio-cetepi
```

Para remover a imagem de laboratório, se não precisar mais dela:

```bash
sudo docker rmi laboratorio-cetepi:v1
```

Se também tiver criado a versão 2:

```bash
sudo docker rmi laboratorio-cetepi:v2
```

Explicação:

- `rmi`: significa remover imagem.
- `laboratorio-cetepi:v1`: identifica exatamente qual imagem será removida.

**Atenção:** não confunda `docker rm` (remove container) com `docker rmi` (remove imagem).

Para excluir a instância EC2, faça isso pelo Console AWS somente com autorização do professor. Encerrar a instância pode interromper o site e causar perda de dados armazenados no disco, dependendo da configuração.

---

# 18. Checklist: concluí o primeiro deploy?

Marque cada etapa quando terminar:

- [ ] Abri o VS Code e carreguei a pasta do projeto.
- [ ] Abri o terminal integrado do VS Code e conferi o Docker.
- [ ] Instalei ou conferi o Git no Windows.
- [ ] Usei `git clone` para obter o repositório do GitHub.
- [ ] Abri a pasta clonada no VS Code.
- [ ] Entendi para que servem `git clone` e `git pull`.
- [ ] Conferi os arquivos do site.
- [ ] Entendi para que serve o Dockerfile.
- [ ] Criei o Dockerfile.
- [ ] Entendi as instruções `FROM`, `COPY`, `EXPOSE` e `CMD`.
- [ ] Construí a imagem Docker no computador.
- [ ] Executei o container localmente com `docker run`.
- [ ] Conferi o container com `docker ps`.
- [ ] Abri o site em `http://localhost` e verifiquei seu funcionamento.
- [ ] Consultei os logs, se necessário, e parei o container local.
- [ ] Criei ou recebi uma instância EC2 Ubuntu.
- [ ] Configurei o Security Group.
- [ ] Acessei a EC2 por SSH.
- [ ] Instalei o Docker no Ubuntu.
- [ ] Enviei os arquivos para a EC2.
- [ ] Construí a imagem no servidor.
- [ ] Executei o container na EC2.
- [ ] Acessei o site pelo IP público da EC2 usando a porta HTTP padrão 80.
- [ ] Consultei os logs e verifiquei o container.

---

# 19. Glossário rápido

| Termo | Significado |
|---|---|
| `FROM` | Define a imagem base no Dockerfile |
| `COPY` | Copia arquivos para dentro da imagem |
| `EXPOSE` | Documenta a porta utilizada pelo serviço no container |
| `CMD` | Define o comando padrão de inicialização do container |
| `nginx` | Servidor web utilizado no laboratório |
| `daemon` | Processo que executa como serviço em segundo plano |
| `foreground` | Primeiro plano; processo ligado ao terminal ou processo principal |
| `image` | Imagem Docker |
| `container` | Instância criada a partir de uma imagem |
| `build` | Construir uma imagem |
| `run` | Criar e iniciar um container |
| `-d` | Executar em segundo plano |
| `-p` | Publicar/mapear portas |
| `-t` | Definir nome e tag de imagem no `docker build` |
| `-i` | Informar arquivo de identidade no comando SSH/SCP |
| `-r` | Copiar diretórios recursivamente no SCP |
| `sudo` | Executar um comando com privilégios administrativos |
| `apt` | Gerenciador de pacotes do Ubuntu |
| `systemctl` | Gerenciador de serviços do Linux |
| `SSH` | Acesso remoto seguro |
| `SCP` | Cópia segura de arquivos via SSH |
| `Git` | Ferramenta para controlar versões e obter atualizações de projetos |
| `GitHub` | Serviço online que hospeda repositórios Git |
| `git clone` | Cria uma cópia local de um repositório remoto |
| `git pull` | Busca e integra atualizações do repositório remoto |
| `EC2` | Máquina virtual na AWS |
| `IP público` | Endereço usado para alcançar a EC2 pela internet |
| `localhost` | A própria máquina em que o comando está sendo executado |
| `HTTP` | Protocolo utilizado para transferir páginas e outros conteúdos web |
| `TCP` | Protocolo de transporte utilizado nas conexões de rede desta prática |

---

# 20. O que você aprendeu?

Ao concluir a prática, você percorreu o caminho entre um site salvo no computador e um site publicado em uma máquina virtual na nuvem.

Você aprendeu que:

1. O **Dockerfile** é a receita que descreve como construir uma imagem.
2. A **imagem Docker** reúne o Nginx e os arquivos do site.
3. O **container** executa o Nginx e entrega os arquivos ao navegador.
4. A **EC2** é a máquina virtual que hospeda o container.
5. O **Ubuntu** é o sistema operacional da EC2.
6. O **SSH** permite administrar o servidor remotamente.
7. O **Security Group** controla o tráfego que chega à EC2.
8. No computador local e na EC2, o parâmetro `-p 80:80` encaminha a porta 80 da máquina para a porta 80 do container.

**Parabéns! Você realizou seu primeiro deploy manual com Docker e AWS EC2.**

O próximo laboratório poderá aprofundar o processo, estudando automação de deploy, Amazon ECR e integração contínua.

---

## Identidade visual do CETEP-I Itaparica

A página inicial utiliza a logomarca institucional armazenada em:

```text
website/assets/logo-cetep-i.jpg
```

Os arquivos do site estão organizados em:

```text
website/index.html
website/css/style.css
website/js/script.js
```

Sempre que alterar HTML, CSS, JavaScript ou imagens, será necessário construir uma nova imagem Docker e recriar o container para que a versão atualizada seja publicada.

