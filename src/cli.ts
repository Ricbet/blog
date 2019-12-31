import * as minimist from "minimist";
import * as path from "path";
import * as fs from "fs";
import * as fsrd from "rd";

/**
 * img 命令参数： -n -> 文章编号
 * new 命令参数： -t -> 文章标题
 *
 *
 */

enum Task {
    IMG = "img",
    NEW = "new",
}

class Cli {
    private currentTask?: Task;
    private readonly articlePath = path.join(__dirname, "article");
    private readonly assetsImgPath = path.join(__dirname, "assets", "img");
    private readonly distPath = path.join(__dirname, "dist");

    constructor() {}

    public run(task: Task | undefined, args: { [key in string]: string }): void {
        this.currentTask = task;
        this.doRun(task, args).catch(error => {
            console.error(error.message);
            process.exit(1);
        });
    }

    private log(message: string, skipNewline: boolean = false): void {
        process.stdout.write(`[${this.currentTask || "default"}] ${message}`);
        if (!skipNewline) {
            process.stdout.write("\n");
        }
    }

    private laAllArticleList(): Array<{ name: string; num: string; path: string }> {
        return fsrd.readFileSync(this.articlePath).map(fileNameWithPath => {
            const name = fileNameWithPath.replace(`${this.articlePath}/`, "");
            return {
                name,
                path: fileNameWithPath,
                num: name.split(".")[0],
            };
        });
    }

    private async task<T>(message: string, fn: () => Promise<T>): Promise<T> {
        const time = Date.now();
        this.log(`${message}...`, true);
        try {
            const t = await fn();
            process.stdout.write(`took ${Date.now() - time}ms\n`);
            return t;
        } catch (error) {
            process.stdout.write("failed\n");
            throw error;
        }
    }

    private async doRun(task: Task, args: { [key in string]: string }): Promise<void> {
        if (task === Task.IMG) {
            // 转换某篇文章里的图片地址到 github 图床，并复刻到 dist 目录
            const allArticle = this.laAllArticleList();
            const currentConversionArt = allArticle.find(e => e.num === args.n.toString());

            if (!currentConversionArt) {
                this.log("找不到文件");
                process.exit(0);
                return;
            }

            await this.task(`开始转换 ${currentConversionArt.name} 里的图片地址`, async () => {
                // Not Implementations
            });
        }

        if (task === Task.NEW) {
            const maxNum = Math.max(...this.laAllArticleList().map(e => parseInt(e.num)));
            const title = args.t;

            await this.task(`正在生成 ${title} 文章`, async () => {
                const newNum = maxNum + 1;
                const fileName = `${newNum}.${title}.md`;
                const fileNameWithPath = `${this.articlePath}/${fileName}`;
                const imgPath = `${this.assetsImgPath}/${newNum}`;

                if (!fs.existsSync(fileNameWithPath)) {
                    fs.writeFileSync(fileNameWithPath, "");
                }

                if (!fs.existsSync(imgPath)) {
                    fs.mkdirSync(imgPath);
                }
            });
        }
    }
}

const cli = new Cli();
const argv = minimist(process.argv);

cli.run(
    argv._.slice(2)[0] as Task,
    (() => {
        delete argv._;
        return argv;
    })()
);
