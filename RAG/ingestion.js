import { PDFParse } from "pdf-parse"; //Yeh line 'pdf-parse' library se 'PDFParse' class ko import karti hai
import fs from "fs/promises"

/*
  Yeh code current directory se 'story.pdf' file ko asynchronously read karta hai
  aur uske data ko PDFParse class mein pass karke ek naya 'parser' instance 
  banata hai, taaki aage is PDF ka text ya content extract kiya ja sake.
*/
const parser = new PDFParse({
    data: await fs.readFile("./story.pdf")
})

const text = await parser.getText(); //Extract all the text in the PDF File

