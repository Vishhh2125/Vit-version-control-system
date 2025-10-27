import fs from "fs";
import path from "path";



const init =() =>{


    const vitDir =path.join(process.cwd(), ".vit");

     if (fs.existsSync(vitDir)) {
    console.log("Repository already initialized.");
    return;
  }
    


    fs.mkdirSync(vitDir);
    fs.mkdirSync(path.join(vitDir, "refs"));
    fs.mkdirSync(path.join(vitDir, "objects"));
    fs.writeFileSync(path.join(vitDir, "HEAD"), "", "utf-8");
    console.log("Initialized empty Vit repository in " + vitDir);


}

export default init;