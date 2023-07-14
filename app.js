const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

let items = [];

main().catch((err) => console.log(err));

async function main() {
    // await mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
    await mongoose.connect("mongodb+srv://admin-alex:<password>@cluster0.ecaqs3f.mongodb.net/todolistDB");


    const itemsSchema = new mongoose.Schema({ task: String });

    const listSchema = {
        name: String,
        items: [itemsSchema],
    };

    const Item = mongoose.model("Item", itemsSchema);

    const List = mongoose.model("List", listSchema);

    const item1 = new Item({ task: "Welcome to your todo list" });

    const item2 = new Item({ task: "hit + to add new item" });

    const item3 = new Item({ task: "<-- hit this to delete the item" });

    let defaultItems = [item1, item2, item3];

    // items = await Item.find({});
    // if (items.length === 0) {
    //     items = [item1, item2]
    //     Item.insertMany(items);
    // }

    app.set("view engine", "ejs");

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static("public"));

    app.get("/", async function (req, res) {
        items = await Item.find({});
        if (items.length === 0) {
            await Item.insertMany(defaultItems);
            res.redirect("/");
        } else {
            console.log(items);
            res.render("list", { titleText: date.getDate(), newLIarr: items });
        }
    });

    // app.get("/work", function (req, res) {
    //     let title = "Work";
    //     res.render("list", { titleText: title, newLIarr: workTasks });
    // });

    app.get("/:listTitle", async function (req, res) {
        let title = _.capitalize(req.params.listTitle);

        let list = await List.findOne({ name: title });

        if (!list) {
            console.log("creating new list");
            list = new List({
                name: title,
                items: defaultItems,
            });
            list.save();
        }

        items = list.items;
        console.log(items);

        res.render("list", { titleText: title, newLIarr: items });
    });

    app.get("/about", function (req, res) {
        res.render("about");
    });

    app.post("/delete", async function (req, res) {
        const checkedItemId = req.body.checkbox;
        const title = req.body.listName

        if (title == date.getDate()) {
            await Item.findByIdAndRemove(checkedItemId);
        } else {
            await List.findOneAndUpdate({name: title}, {$pull: {items: {_id: checkedItemId}}});
            await Item.findByIdAndRemove(checkedItemId);
        }

        res.redirect("back");
    });

    app.post("/", async function (req, res) {
        let item = req.body.newItem;
        let title = req.body.list;

        //add to db
        const newItem = new Item({ task: item });
        newItem.save();



        const list = await List.findOne({name: title})
        if(list){
            let currentLI = list.items;
            console.log(currentLI);
            currentLI.push(newItem);
            console.log(currentLI);
            await List.findOneAndUpdate({name: title}, {items: currentLI});
        }

        
        //add to list
        items.push(newItem);

        res.redirect("back");
    });

    app.listen(3000, function () {
        console.log("Server is running on port 3000");
    });
}
