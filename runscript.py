import asyncio
from datetime import datetime
from time import sleep

import sqlalchemy as db
from sqlalchemy.engine import result

from random import random

from sqlalchemy.orm import Session

from app import TickersModel, TickersModelHistory


class TickerPrice:
    def __init__(self, session=None):
        self.session = session

    async def generate_movement(self):
        """Function to generate ticker prices"""
        movement = -1 if random() < 0.5 else 1
        return movement

    async def filldata(self):
        """Function to fill the tickers table with default data"""
        # Generate name list and fill data in tickers table
        for i in [f'ticker_{i:02}' for i in range(100)]:
            new_ticker = TickersModel(ticker_name=i, price=0, time=datetime.now().replace(microsecond=0))
            self.session.add(new_ticker)
        # Сохраняем БД
        self.session.flush()
        self.session.commit()
        return result

    async def select_data(self):
        """Function to get data from the tickers table"""
        # Get all names, prices and dates for all the tickers
        tickers = TickersModel.query.with_entities(TickersModel.ticker_name, TickersModel.price, TickersModel.time).all()
        return tickers

    # Update data
    async def main(self):
        tickers = asyncio.create_task(self.select_data())
        # If table "tickers" is empty, we upload data
        if not await tickers:
            await self.filldata()
            tickers = asyncio.create_task(self.select_data())
        # Copy previous data from table "tickers" to "tickers_history"
        for ticker in await tickers:
            old_ticker = TickersModelHistory(ticker_name=ticker[0], price=ticker[1], time=ticker[2])
            self.session.add(old_ticker)
        self.session.flush()
        self.session.commit()  # Save data
        # Update previous data in table "tickers"
        for ticker in await tickers:
            price = await self.generate_movement() + int(ticker[1])
            newdate = datetime.now().replace(microsecond=0)
            new_ticker_price = TickersModel.query.filter_by(ticker_name=ticker[0]).first()
            new_ticker_price.price = price
            new_ticker_price.time = newdate
            self.session = self.session.object_session(new_ticker_price)
            self.session.add(new_ticker_price)
        self.session.flush()
        self.session.commit()
        return True


if __name__ == '__main__':
    """Main function which loads new data in "tickers" and save previos data in "tickers_history" """
    engine = db.create_engine("postgresql://postgres:admin@localhost:5432/tickers")
    session = Session(engine)
    run_generator = TickerPrice(session)
    while True:
        asyncio.run(run_generator.main())
        sleep(1)
