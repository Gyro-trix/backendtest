import { type Request, type Response } from 'express'
import * as rest from '../utils/rest'
import Joi from 'joi'

import mysql, { RowDataPacket } from 'mysql2'
import * as dotenv from 'dotenv'