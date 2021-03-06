import { Request, Response } from "express";
import knex from "../database/connection";

class PointsController {
  async index(req: Request, res: Response) {
    const { city, uf, items } = req.query;

    const parseItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

    const points = await knex("points")
      .join("points_items", "points.id", "=", "points_items.point_id")
      .whereIn("points_items.items_id", parseItems)
      .where("city", String(city))
      .where("uf", String(uf))
      .distinct()
      .select("points.*");

      return res.json(points)
  }

  async create(req: Request, res: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = req.body;

    const trx = await knex.transaction();

    const points = {
      image: "image-fake",
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };

    const ids = await trx("points").insert(points);

    const pointItems = items
    .split(',')
    .map((item:string) => Number(item.trim()))
    .map((items_id: number) => {
      return {
        items_id,
        point_id: ids[0],
      };
    });

    await trx("points_items").insert(pointItems);

    trx.commit();

    return res.json({
      id: ids[0],
      ...points,
    });
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;

    const point = await knex("points").where("id", id).first();

    if (!point) {
      return res.status(400).json({ message: "Point not found" });
    }

    const items = await knex("items")
      .join("points_items", "items.id", "=", "points_items.items_id")
      .where("points_items.point_id", id)
      .select("items.title");

    return res.json({ point, items });
  }
}

export default PointsController;
